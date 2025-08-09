import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import Problem from "../models/Problem.js";
import {
  MAX_TIME_LIMIT,
  MIN_MEMORY_LIMIT,
  VERDICTS,
  axoisCEEHeaders,
  supportedLanguages,
} from "../constants.js";
import axios from "axios";
import Submission from "../models/Submission.js";
import User from "../models/User.js";

// @Route : GET /api/v1/submissions
// @DESC : Get all submissions
const getAllSubmissions = asyncHandler(async (req, res) => {
  // 1. Extract query parameters for pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // 2. Get total count of submissions
  const totalSubmissions = await Submission.countDocuments();

  // 3. Query the database to get all submissions with pagination
  const submissions = await Submission.find()
    .populate("problemId", "title difficulty")
    .populate("userId", "username email")
    .select("_id finalVerdict executionTime memoryUsed languageId createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  // 4. Calculate pagination metadata
  const totalPages = Math.ceil(totalSubmissions / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // 5. Return the submissions with pagination info
  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: {
      submissions,
      pagination: {
        currentPage: page,
        totalPages,
        totalSubmissions,
        hasNextPage,
        hasPrevPage,
        limit,
      },
    },
  });
});

// @Route : GET /api/submissions/my
// @DESC : Get all submissions of the user
const getAllSubmissionsOfUser = asyncHandler(async (req, res) => {
  // 1. Extract the user ID from the authenticated user in the request object
  const userId = req.user._id;

  // 2. Query the database to get all submissions for the authenticated user
  const submissions = await User.findById(userId)
    .populate(
      "submissions",
      "_id executionTime finalVerdict createdAt memoryUsed languageId"
    )
    .select("_id")
    .exec();

  // 3. Check if no submissions are found
  if (!submissions || submissions.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: StatusCodes.NOT_FOUND,
      success: false,
      message: "No submissions found for this user.",
    });
  }

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: submissions,
  });
});

// @Route : GET /api/submissions/problems/:id
// @DESC : Get all submissions of a problem
const getAllSubmissionsOfProblem = asyncHandler(async (req, res) => {
  // 1. Get the problem id from the request params
  // 2. Check if the problem exists
  // 3. Get the submission ids from the problem
  // 4. Get all the submissions from the database
  // 5. Return the submissions

  const problemId = req.params.id;
  let problem = await Problem.findById(problemId)
    .populate(
      "submissionIds",
      "_id finalVerdict executionTime memoryUsed createdAt "
    )
    .select("_id")
    .exec();

  if (!problem) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Problem not found"
    );
  }

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: problem,
  });
});

// @route POST /api/submissions/problem/:id
// @desc Submit a solution for a problem
const submitSolution = asyncHandler(async (req, res) => {
  // 1. Get the problem id and solution from the request body
  // 1.1 check if the submission already exists
  // 2. Validate the solution
  // 3. Send the submission to the judge queue
  // 4. get the submission details
  // 5. Save the submission details in the database
  // 5.1 add the submissionId to the problem
  // 5.2 add the submissionId to the user
  // 6. Return the submission details

  const problemId = req.params.id;

  const source_code = req.body.source_code;
  const languageId = req.body.language_id;

  if (!problemId) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "problemId is required"
    );
  }
  if (!source_code) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "source_code is required"
    );
  }
  if (!languageId) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "languageId is required"
    );
  }
  if (!supportedLanguages.includes(languageId)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      "Language not supported"
    );
  }

  // check if the submission already exists
  const existingSubmission = await Submission.exists({
    $and: [
      { problemId },
      { source_code },
      { userId: req.user._id },
      { language_id: languageId },
    ],
  });

  if (existingSubmission) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      "Submission already exists"
    );
  }

  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Problem not found"
    );
  }

  // run the submission for all test cases
  // get the verdict

  const testCases = await Problem.findById(problemId)
    .populate("testcaseIds")
    .select("testcaseIds")
    .exec();

  const submissionData = {
    submissions: [],
  };

  // check if the problem has any testcases
  if (!testCases.testcaseIds.length) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      "No testcases found for the problem"
    );
  }

  // create submission data for all test cases
  for (let i = 0; i < testCases.testcaseIds.length; i++) {
    const currentSubmission = {
      language_id: languageId,
      source_code,
      cpu_time_limit: Math.min(
        Number(problem.timeLimit) / 1000,
        MAX_TIME_LIMIT
      ),
      memory_limit: Math.max(Number(problem.memoryLimit), MIN_MEMORY_LIMIT),
      stdin: testCases.testcaseIds[i].input,
      expected_output: testCases.testcaseIds[i].expectedOutput,
    };

    submissionData.submissions.push(currentSubmission);
  }

  // submit the solution to the judge queue and get tokens
  const axoisCreateOptions = {
    method: "POST",
    url: `${process.env.CEE_URI}/submissions/batch`,
    params: {
      base64_encoded: "true",
      wait: "false",
    },
    headers: axoisCEEHeaders,
    data: submissionData,
  };
  let tokens = [];

  try {
    const result = await axios.request(axoisCreateOptions);
    tokens = result.data;
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error submitting the solution",
      error
    );
  }

  const testCasesData = [];
  for (let i = 0; i < tokens.length; i++) {
    const currentTestCase = {
      token: tokens[i].token,
      verdict: "PENDING",
      executionTime: 0,
      memoryUsed: 0,
    };
    testCasesData.push(currentTestCase);
  }

  const submission = {
    problemId,
    userId: req.user._id,
    languageId,
    source_code,
    finalVerdict: "PENDING",
    testCaseResults: testCasesData,
    executionTime: 0,
    memoryUsed: 0,
  };

  // save the submission in the database
  const submissionResult = await Submission.create(submission);

  // add the submissionId to the problem
  problem.submissionIds.push(submissionResult._id);
  await problem.save();
  // add the submissionId to the user
  req.user.submissions.push(submissionResult._id);
  await req.user.save();

  // continously fetch the results from the judge queue untill all test cases are judged
  // @ TODO : use websockets or long polling to get the results & improve performance
  // @ WARNING : this is a very costly operation and should be optimized

  const axoisGetOptions = {
    method: "GET",
    url: `${process.env.CEE_URI}/submissions/batch`,
    params: {
      base64_encoded: "true",
      fields: "time,status,memory,stdout",
      tokens: tokens.map((token) => token.token).join(","), // get the tokens from the response
    },
    headers: axoisCEEHeaders,
  };

  // fetch the results from the judge queue
  const interval = setInterval(async () => {
    try {
      if (submissionResult.finalVerdict !== VERDICTS.PENDING) {
        clearInterval(interval);
      }
      let lastestResult = await axios.request(axoisGetOptions);
      lastestResult = lastestResult.data.submissions;

      // check for compilation error
      if (lastestResult.length > 0 && lastestResult[0].compile_output != null) {
        submissionResult.finalVerdict = VERDICTS.CE;
        submissionResult.testCaseResults[0].verdict = VERDICTS.CE;
        await submissionResult.save();
        clearInterval(interval);
      }

      // check if all testcases are judged
      let isAllJudged = true;
      let skip = false;

      for (let i = 0; i < lastestResult.length; i++) {
        const currentTestcase = lastestResult[i];

        if (skip) {
          submissionResult.testCaseResults[i].verdict = VERDICTS.SKIPPED;
          continue;
        }
        // check if the testcase is not judged
        if (currentTestcase.status.id <= 2) {
          isAllJudged = false;
          break;
        }
        // check if the testcase is accepted
        else if (currentTestcase.status.id === 3) {
          submissionResult.finalVerdict = VERDICTS.AC;
          submissionResult.testCaseResults[i].verdict = VERDICTS.AC;
          submissionResult.testCaseResults[i].executionTime =
            currentTestcase.time;
          submissionResult.testCaseResults[i].memoryUsed =
            currentTestcase.memory;

          await submissionResult.save();
        }
        // check if the testcase is wrong answer
        else {
          skip = true;

          submissionResult.testCaseResults[i].executionTime =
            currentTestcase.time;
          submissionResult.testCaseResults[i].memoryUsed =
            currentTestcase.memory;

          // set the final verdict based on the testcase status
          switch (currentTestcase.status.id) {
            case 4:
              submissionResult.finalVerdict = VERDICTS.WA;
              submissionResult.testCaseResults[i].verdict = VERDICTS.WA;
              break;
            case 5:
              submissionResult.finalVerdict = VERDICTS.TLE;
              submissionResult.testCaseResults[i].verdict = VERDICTS.TLE;
              break;
            case 6:
              submissionResult.finalVerdict = VERDICTS.CE;
              submissionResult.testCaseResults[i].verdict = VERDICTS.CE;
              break;
            default:
              submissionResult.finalVerdict = VERDICTS.RE;
              submissionResult.testCaseResults[i].verdict = VERDICTS.RE;
              break;
          }
        }
      }

      await submissionResult.save();

      if (isAllJudged) {
        clearInterval(interval);
      }
    } catch (error) {
      console.log("Error in fetching all testcases output : ", error);
      clearInterval(interval);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error in fetching all testcases output",
        error
      );
    }
  }, 5000);

  setTimeout(() => {
    clearInterval(interval);

    if (submissionResult.finalVerdict === VERDICTS.PENDING) {
      submissionResult.finalVerdict = VERDICTS.TLE;

      for (let i = 0; i < submissionResult.testCaseResults.length; i++) {
        if (submissionResult.testCaseResults[i].verdict === VERDICTS.PENDING) {
          submissionResult.testCaseResults[i].verdict = VERDICTS.TLE;
          break;
        }
      }
      for (let i = 0; i < submissionResult.testCaseResults.length; i++) {
        if (submissionResult.testCaseResults[i].verdict === VERDICTS.PENDING) {
          submissionResult.testCaseResults[i].verdict = VERDICTS.SKIPPED;
        }
      }

      submissionResult.save();
    }
  }, 10 * 5000);

  res.status(StatusCodes.CREATED).json({
    status: StatusCodes.CREATED,
    success: true,
    data: submissionResult,
  });
});

// @route GET /api/submissions/:subID
// @desc Get the details of a specific submission
const getSubmissionDetails = asyncHandler(async (req, res) => {
  // 1. Get the submission id from the request params
  // 2. Get the submission details from the database
  // 3. Check if the submission exists
  // 4. send the submission details

  const submissionId = req.params.subID;
  const submission = await Submission.findById(submissionId);

  if (!submission) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Submission not found"
    );
  }

  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    success: true,
    data: submission,
  });
});

// Rejudge a specific submission | only for admin
const rejudgeSubmission = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Rejudge all submissions for a problem | only for admin
const rejudgeAllSubmissionsForProblem = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Get the status of a submission (queued, running, judged)
const getSubmissionStatus = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Toggle the visibility of a submission
const toggleSubmissionVisibility = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

export {
  getAllSubmissions,
  getAllSubmissionsOfUser,
  getAllSubmissionsOfProblem,
  submitSolution,
  getSubmissionDetails,
  rejudgeSubmission,
  rejudgeAllSubmissionsForProblem,
  getSubmissionStatus,
  toggleSubmissionVisibility,
};

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

// Get all submissions of the logged-in user
const getAllSubmissionsOfUser = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Get all submissions of a specific problem
const getAllSubmissionsOfProblem = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
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
  getAllSubmissionsOfUser,
  getAllSubmissionsOfProblem,
  submitSolution,
  getSubmissionDetails,
  rejudgeSubmission,
  rejudgeAllSubmissionsForProblem,
  getSubmissionStatus,
  toggleSubmissionVisibility,
};

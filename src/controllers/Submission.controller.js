import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import Problem from "../models/Problem.js";
import {
  MAX_TIME_LIMIT,
  MIN_MEMORY_LIMIT,
  VERDICTS,
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
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": process.env.CEE_API_HOST,
      "x-rapidapi-key": process.env.CEE_API_KEY,
    },
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

  console.log(tokens);

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

  res.status(StatusCodes.CREATED).json({
    submissionResult,
  });
});

// Get details of a specific submission. if user, show it or check if it is public or not
const getSubmissionDetails = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
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

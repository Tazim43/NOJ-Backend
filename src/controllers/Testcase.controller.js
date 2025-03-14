import { asyncHandler } from "../utils/asyncHandler.js";
import Problem from "../models/Problem.js";
import Solution from "../models/Solution.js";
import Testcase from "../models/Testcase.js";
import ApiError from "../utils/apiError.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import axios from "axios";
import { fetchSingleSubmission } from "../utils/fetchSubmission.js";
import { base64Decode } from "../utils/base64.js";

// @route POST /api/testcases/problem/:id
// @desc get all testcases of a problem
const getAllTestcases = asyncHandler(async (req, res) => {
  res.json({ msg: "Get all testcases" });
});

// @route GET /api/testcases/problem/:id/testcase/:tcId
// @desc get a testcase by id
const getTestcaseById = asyncHandler(async (req, res) => {
  // 1. Get the problem id and testcase id from the request params
  // 2. Check if the problem exists
  // 3. Check if the testcase exists
  // 4. Send the response

  const problemId = req.params.id;
  const testcaseId = req.params.tcId;

  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Problem not found"
    );
  }
  const testcase = await Testcase.findById(testcaseId);
  if (!testcase) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Testcase not found"
    );
  }

  res.status(StatusCodes.OK).json(testcase);
});

// @route POST /api/testcases/problem/:id
// @desc create a testcase
const createTestcase = asyncHandler(async (req, res) => {
  // 1. Get the problem id from the request params
  // 2. Get the testcase data from the request body
  // 3. Check if the problem exists
  // 4. Generate the expected output if not provided
  // 5. Save the testcase to the database
  // 6. Send the response

  const problemId = req.params.id;
  const problem = await Problem.findById(problemId);

  if (!problem) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Problem not found"
    );
  }

  if (!req.body.input) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      "Input is required"
    );
  }

  const testcaseData = {
    problemId,
    input: req.body.input, // base64 encoded
    expectedOutput: req.body?.expectedOutput, // base64 encoded
    isSample: req.body?.isSample ? req.body.isSample : false,
  };

  if (!testcaseData.expectedOutput) {
    // fetch the expected output from the compiler
    // first solution is used to generate testcase output
    const solutionId = problem.solutionIds[0];
    const solution = await Solution.findById(solutionId);

    if (!solution) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        ReasonPhrases.NOT_FOUND,
        "Solution not found"
      );
    }

    const axiosOptions = {
      method: "POST",
      params: {
        base64_encoded: "true",
        wait: false,
      },
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": process.env.CEE_API_HOST,
        "x-rapidapi-key": process.env.CEE_API_KEY,
      },
      data: {
        source_code: solution.source_code,
        language_id: solution.languageId,
        stdin: testcaseData.input,
      },
    };

    // generate the expected output
    try {
      const response = await axios.request(
        `${process.env.CEE_URI}/submissions`,
        axiosOptions
      );

      const token = response.data.token;
      console.log("Token: ", token);
      const expectedOutput = await fetchSingleSubmission(token);

      testcaseData.expectedOutput = expectedOutput.stdout;
      testcaseData.cpu_time = expectedOutput?.time;
      testcaseData.memory = expectedOutput?.memory;
    } catch (error) {
      console.log("Couldn't generate testcase output: ", error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ReasonPhrases.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  // save the testcase to the database
  const testcase = await Testcase.create(testcaseData);

  // add the testcase id to the problem
  problem.testcaseIds.push(testcase._id);
  await problem.save();

  res.status(StatusCodes.CREATED).json(testcase);
});

// @route PUT /api/testcases/problem/:id/testcase/:tcId
// @desc update a testcase
const updateTestcase = asyncHandler(async (req, res) => {
  res.json({ msg: "Update a testcase" });
});

// @route DELETE /api/testcases/problem/:id/testcase/:tcId
// @desc delete a testcase
const deleteTestcase = asyncHandler(async (req, res) => {
  res.json({ msg: "Delete a testcase" });
});

export {
  getAllTestcases,
  getTestcaseById,
  createTestcase,
  updateTestcase,
  deleteTestcase,
};

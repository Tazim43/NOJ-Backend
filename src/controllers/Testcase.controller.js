import { asyncHandler } from "../utils/asyncHandler.js";
import Problem from "../models/Problem.js";
import Solution from "../models/Solution.js";
import Testcase from "../models/Testcase.js";
import ApiError from "../utils/apiError.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import axios from "axios";
import { fetchSingleSubmission } from "../utils/fetchSubmission.js";
import { axoisCEEHeaders, TESTCASE_LIMIT } from "../constants.js";
import { testcaseValidation } from "../validation/problemAssetsValidation.js";

// @route POST /api/testcases/problem/:id
// @desc get all testcases of a problem
const getAllTestcases = asyncHandler(async (req, res) => {
  // 1. Get the problem id from the request params
  // 2. Check if the problem exists
  // 3. Get all the testcases of the problem
  // 4. Send the response

  const problemId = req.params.id;
  const problem = await Problem.findById(problemId);
  console.log("Problem ID: ", problemId);
  if (!problem) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Problem not found"
    );
  }

  const testcases = await Testcase.find({ problemId });
  res.status(StatusCodes.OK).json(testcases);
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

// @route GET /api/testcases/sample/problem/:id
// @desc get all sample testcases of a problem
const getAllSampleTestcases = asyncHandler(async (req, res) => {
  // 1. Get the problem id from the request params
  // 2. Check if the problem exists
  // 3. Get all the sample testcases of the problem
  // 4. Send the response
  const problemId = req.params.id;
  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Problem not found"
    );
  }
  const testcases = await Testcase.find({ problemId, isSample: true });
  res.status(StatusCodes.OK).json(testcases);
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

  // check if the testcase count exit the limit
  if (problem.testcaseIds.length >= TESTCASE_LIMIT) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      `Testcase limit reached. Maximum ${TESTCASE_LIMIT} testcases are allowed`
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
    expectedOutput: req.body.expectedOutput ? req.body.expectedOutput : null, // base64 encoded
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
      headers: axoisCEEHeaders,
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

      const expectedOutput = await fetchSingleSubmission(token);

      testcaseData.expectedOutput = expectedOutput.stdout;
      testcaseData.cpu_time = expectedOutput.time
        ? Number(expectedOutput.time)
        : 0;
      testcaseData.memory = expectedOutput.memory ? expectedOutput.memory : 0;
    } catch (error) {
      console.log("Couldn't generate testcase output: ", error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ReasonPhrases.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }
  // validate the testcase data
  const validation = testcaseValidation.safeParse(testcaseData);
  if (!validation.success) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      validation.error.errors
    );
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
  // 1. Get the problem id and testcase id from the request params
  // 2. Get the updated testcase data from the request body
  // 3. Check if the problem exists
  // 4. Check if the testcase exists
  // 5 generate the expected output if not provided
  // 6. Update the testcase

  // TODO_OPTIMIZE: match the input with previous input to avoid recompilation

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

  const testcaseData = await Testcase.findById(testcaseId);
  if (!testcaseData) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Testcase not found"
    );
  }

  // update the testcase data
  testcaseData.input = req.body.input ? req.body.input : testcaseData.input;
  testcaseData.expectedOutput = req.body.expectedOutput
    ? req.body.expectedOutput
    : null;
  testcaseData.isSample = req.body.isSample
    ? req.body.isSample
    : testcaseData.isSample;

  // generate the expected output if not provided
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
      headers: axoisCEEHeaders,
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

  // validate the updated testcase data
  const validation = testcaseValidation
    .pick({
      input: true,
      expectedOutput: true,
      isSample: true,
    })
    .safeParse(testcaseData);
  if (!validation.success) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      validation.error.errors
    );
  }

  // update the testcase
  const updatedTestcase = await Testcase.findByIdAndUpdate(
    { _id: testcaseId },
    testcaseData,
    {
      new: true,
    }
  );

  res.status(StatusCodes.OK).json(updatedTestcase);
});

// @route DELETE /api/testcases/problem/:id/testcase/:tcId
// @desc delete a testcase
const deleteTestcase = asyncHandler(async (req, res) => {
  // 1. Get the problem id and testcase id from the request params
  // 2. Check if the problem exists
  // 3. Check if the testcase exists
  // 4. Delete the testcase

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

  // delete the testcase
  await Testcase.findByIdAndDelete(testcaseId);
  // remove the testcase id from the problem
  await Problem.findByIdAndUpdate(problemId, {
    $pull: { testcaseIds: testcaseId },
  });

  await problem.save();

  res
    .status(StatusCodes.OK)
    .json({ msg: "Testcase Deleted", deletedTestcase: testcase });
});

export {
  getAllTestcases,
  getTestcaseById,
  createTestcase,
  updateTestcase,
  deleteTestcase,
  getAllSampleTestcases,
};

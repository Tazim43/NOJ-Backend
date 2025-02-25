import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import problemValidationSchema from "../validation/problemValidationSchema.js";
import ApiError from "../utils/apiError.js";
import Problem from "../models/Problem.js";

// Create a new problem with current user as author
// POST /api/v1/problems
const createProblem = asyncHandler(async (req, res) => {
  req.body.authorIds = [req.user._id.toString()];

  const validationResult = problemValidationSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      validationResult.error.errors
    );
  }

  const problemData = await Problem.create(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Problem created successfully",
    problem: problemData,
  });
});

// Create a new problem statement
// POST /api/v1/problems/:id/statement
const createProblemStatement = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const updateProblemStatement = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const getAllProblems = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const getProblemById = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const getProblemStatementById = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const updateProblem = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const deleteProblem = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const updateProblemVisibility = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

export {
  getAllProblems,
  getProblemById,
  getProblemStatementById,
  createProblem,
  createProblemStatement,
  updateProblem,
  updateProblemStatement,
  deleteProblem,
  updateProblemVisibility,
};

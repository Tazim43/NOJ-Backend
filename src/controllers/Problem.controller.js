import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import problemValidationSchema from "../validation/problemValidationSchema.js";
import { problemStatementValidation } from "../validation/problemStatementValidation.js";
import ApiError from "../utils/apiError.js";
import Problem from "../models/Problem.js";
import ProblemStatement from "../models/ProblemStatement.js";
import fs from "fs";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

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
  const problemDetails = await Problem.findById(req.params.id);
  if (!problemDetails) {
    throw new ApiError(StatusCodes.NOT_FOUND, ReasonPhrases.NOT_FOUND);
  }

  if (problemDetails.statementId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Problem statement already exists"
    );
  }

  if (!req.body.imageList) req.body.imageList = [];
  // validate request body
  const validationResult = problemStatementValidation.safeParse(req.body);
  if (!validationResult.success) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      validationResult.error.errors
    );
  }

  const statementData = validationResult.data;

  // handle image upload
  if (req.files) {
    for (const file of req.files) {
      try {
        const imageUrl = await uploadOnCloudinary(
          file.path,
          "problem-statements"
        );
        if (fs.existsSync(file.path)) {
          console.log(file.path);
          fs.unlinkSync(file.path);
        }
        statementData.imageList.push(imageUrl);
      } catch (err) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          ReasonPhrases.INTERNAL_SERVER_ERROR,
          err.message
        );
      }
    }
  }

  const problemStatement = new ProblemStatement(statementData);
  problemDetails.statementId = problemStatement._id;

  await problemDetails.save();
  await problemStatement.save();

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Problem statement created successfully",
    problemStatement,
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

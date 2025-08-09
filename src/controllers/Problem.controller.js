import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import problemValidationSchema from "../validation/problemValidationSchema.js";
import { problemStatementValidation } from "../validation/problemAssetsValidation.js";
import ApiError from "../utils/apiError.js";
import Problem from "../models/Problem.js";
import ProblemStatement from "../models/ProblemStatement.js";
import fs from "fs";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import Submission from "../models/Submission.js";
import jwt from "jsonwebtoken";

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
          // console.log(file.path);

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

// Update an existing problem statement
// PUT /api/v1/problems/:id/statement
const updateProblemStatement = asyncHandler(async (req, res) => {
  const problemDetails = await Problem.findById(req.params.id);
  if (!problemDetails) {
    throw new ApiError(StatusCodes.NOT_FOUND, ReasonPhrases.NOT_FOUND);
  }

  if (!problemDetails.statementId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Problem statement does not exist"
    );
  }

  const problemStatement = await ProblemStatement.findById(
    problemDetails.statementId
  );

  if (!problemStatement) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Problem statement record not found"
    );
  }

  if (!req.body.imageList) req.body.imageList = problemStatement.imageList;

  // Validate request body
  const validationResult = problemStatementValidation.safeParse(req.body);
  if (!validationResult.success) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      validationResult.error.errors
    );
  }

  const updatedStatementData = validationResult.data;

  // Handle new image uploads
  if (req.files) {
    for (const file of req.files) {
      try {
        const imageUrl = await uploadOnCloudinary(
          file.path,
          "problem-statements"
        );
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        updatedStatementData.imageList.push(imageUrl);
      } catch (err) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          ReasonPhrases.INTERNAL_SERVER_ERROR,
          err.message
        );
      }
    }
  }

  // Update the ProblemStatement document
  const updatedProblemStatement = await ProblemStatement.findByIdAndUpdate(
    problemStatement._id,
    updatedStatementData,
    { new: true, runValidators: true }
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Problem statement updated successfully",
    updatedProblemStatement,
  });
});

// Get all visible problems with only title and id
// GET /api/v1/problems
const getAllProblems = asyncHandler(async (req, res) => {
  // console.log("Fetching all visible problems...");
  const problems = await Problem.find(
    { isVisible: true },
    "_id title timeLimit memoryLimit tags difficulty"
  ).lean();

  // Decode user ID from access token in cookies
  let currentUserId = null;
  if (req.cookies?.accessToken) {
    try {
      const decoded = jwt.verify(
        req.cookies.accessToken,
        process.env.JWT_SECRET
      );
      currentUserId = decoded._id || decoded.id || decoded.userId;
    } catch (error) {
      // Invalid token, continue without user context
      console.log("Invalid access token:", error.message);
    }
  }

  console.log(`Current user ID: ${currentUserId}`);

  for (const problem of problems) {
    // console.log(problem);
    let submissionCount = await Submission.aggregate([
      { $match: { problemId: problem._id, finalVerdict: "ACCEPTED" } },
      { $group: { _id: "$userId" } },
      { $count: "count" },
    ]);

    submissionCount = submissionCount.length > 0 ? submissionCount[0].count : 0;

    problem.solveCount = submissionCount;

    // Check if current user has solved this problem
    if (currentUserId) {
      const userSolved = await Submission.findOne({
        problemId: problem._id,
        userId: currentUserId,
        finalVerdict: "ACCEPTED",
      }).lean();

      console.log(userSolved);

      problem.isSolvedByCurrentUser = !!userSolved;
    } else {
      problem.isSolvedByCurrentUser = false;
    }
  }

  console.log(problems);

  res.status(StatusCodes.OK).json({
    success: true,
    problems,
  });
});

// Get all problems of current user
// GET /api/v1/problems/my
const getMyProblems = asyncHandler(async (req, res) => {
  // Decode user ID from access token in cookies
  let currentUserId = null;
  if (req.cookies?.accessToken) {
    try {
      const decoded = jwt.verify(
        req.cookies.accessToken,
        process.env.JWT_SECRET
      );
      console.log(`Decoded token:`, decoded);
      currentUserId = decoded._id || decoded.id || decoded.userId;
    } catch (error) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid access token");
    }
  } else {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Access token required");
  }

  if (!currentUserId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User ID not found in token");
  }

  // console.log(`Fetching problems for user ${currentUserId}...`);

  const problems = await Problem.find(
    { authorIds: { $in: [currentUserId] } },
    "_id title statementId timeLimit memoryLimit tags difficulty"
  ).lean();

  if (!problems || problems.length === 0) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "No problems found for the current user"
    );
  }

  for (const problem of problems) {
    // console.log(problem);
    let submissionCount = await Submission.aggregate([
      { $match: { problemId: problem._id, finalVerdict: "ACCEPTED" } },
      { $group: { _id: "$userId" } },
      { $count: "count" },
    ]);

    submissionCount = submissionCount.length > 0 ? submissionCount[0].count : 0;

    problem.solveCount = submissionCount;

    // Check if current user has solved this problem
    const userSolved = await Submission.findOne({
      problemId: problem._id,
      userId: currentUserId,
      finalVerdict: "ACCEPTED",
    }).lean();

    problem.isSolvedByCurrentUser = !!userSolved;
  }

  res.status(StatusCodes.OK).json({
    success: true,
    problems,
  });
});

// Get a problem by id : public
// GET /api/v1/problems/:id
const getProblemById = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({
    _id: req.params.id,
  })
    .populate("statementId")
    .exec();

  // console.log(`Fetching problem with ID: ${req.params.id}`);
  // console.log(problem);
  if (!problem) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Problem not found"
    );
  }

  res.status(StatusCodes.OK).json({
    success: true,
    problem,
  });
});

// Get a problem statement by id : public
// GET /api/v1/problems/:id/statement
const getProblemStatementById = asyncHandler(async (req, res) => {
  let statementId = await Problem.findById(req.params.id, "statementId").exec();

  if (!statementId) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Problem statement not found"
    );
  }

  statementId = statementId.statementId.toString();
  const problemStatement = await ProblemStatement.findById(statementId).exec();

  if (!problemStatement) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      ReasonPhrases.NOT_FOUND,
      "Problem statement not found"
    );
  }

  res.status(StatusCodes.OK).json({
    success: true,
    problemStatement,
  });
});

// Update a problem by id
// PUT /api/v1/problems/:id
const updateProblem = asyncHandler(async (req, res) => {
  const problemData = req.body;

  const validationResult = problemValidationSchema.safeParse(problemData);
  if (!validationResult.success) {
    // console.log(validationResult);
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      validationResult.error.errors
    );
  }

  const updatedProblem = await Problem.findByIdAndUpdate(
    req.params.id,
    validationResult.data,
    { new: true, runValidators: true }
  );

  res.status(StatusCodes.OK).json({
    success: true,
    updatedProblem,
  });
});

// Delete a problem by id
// DELETE /api/v1/problems/:id
const deleteProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findByIdAndDelete(req.params.id);
  if (!problem) {
    throw new ApiError(StatusCodes.NOT_FOUND, ReasonPhrases.NOT_FOUND);
  }

  // Delete the problem statement if it exists1
  if (problem.statementId) {
    await ProblemStatement.findByIdAndDelete(problem.statementId);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Problem deleted successfully",
  });
});

const updateProblemVisibility = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id);

  if (!problem) {
    throw new ApiError(StatusCodes.NOT_FOUND, ReasonPhrases.NOT_FOUND);
  }

  problem.isVisible = !problem.isVisible;
  await problem.save();

  res.status(StatusCodes.OK).json({
    success: true,
    isVisible: problem.isVisible,
    message: `Problem visibility updated to ${problem.isVisible}`,
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
  getMyProblems,
};

import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Check if the user is authenticated using JWT token in the request header or cookie
const authenticate = asyncHandler(async (req, _, next) => {
  try {
    // Get the token from the request header or cookie
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("No token found");
      throw new ApiError(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN);
    }

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET); // verify the token
    } catch (error) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ReasonPhrases.UNAUTHORIZED,
        error
      );
    }

    // Find the user by the id in the token
    const user = await User.findById(decoded.id).select(
      "-password -passwordResetToken -refreshToken -emailVerificationToken"
    );

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, ReasonPhrases.UNAUTHORIZED);
    }
    // Set the user in the request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ReasonPhrases.INTERNAL_SERVER_ERROR
      );
    }
  }
});

// Authorize roles
const authorize = (...roles) => {
  return (req, _, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN);
    }
    next();
  };
};

// Authorize Problem author
const authorizeProblemAuthor = asyncHandler(async (req, _, next) => {
  try {
    const problemId = req.params.id;
    const user = req.user;
    const problem = await Problem.findById(problemId);
    if (!problem) {
      throw new ApiError(StatusCodes.NOT_FOUND, ReasonPhrases.NOT_FOUND);
    }
    let isAuthor = false;
    problem.authorIds.forEach((authorId) => {
      isAuthor |= authorId.toString() === user._id.toString();
    });

    if (!isAuthor) {
      throw new ApiError(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN);
    }
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ReasonPhrases.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }
});

const authorizeSubmissionAuthor = asyncHandler(async (req, _, next) => {
  try {
    const submissionId = req.params.subID;
    const user = req.user;
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        ReasonPhrases.NOT_FOUND,
        "Submission not found"
      );
    }

    if (submission.isPublic) {
      next();
      return;
    }

    if (submission.userId.toString() !== user._id.toString()) {
      throw new ApiError(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN);
    }
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ReasonPhrases.INTERNAL_SERVER_ERROR
      );
    }
  }
});

// Verify refresh token in the request cookie and attach the user to the request object
const verifyRefreshToken = asyncHandler(async (req, _, next) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.header("refreshToken");

    if (!refreshToken) {
      throw new ApiError(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET); // Verify the refresh token
    } catch (error) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, ReasonPhrases.UNAUTHORIZED);
    }

    // Find the user by the id in the token
    const user = await User.findById(decoded.id).select(
      "-password -passwordResetToken -refreshToken -emailVerificationToken "
    );

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, ReasonPhrases.UNAUTHORIZED);
    }
    // Attach the user to the request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        ReasonPhrases.INTERNAL_SERVER_ERROR
      );
    }
  }
});

export {
  authenticate,
  authorize,
  authorizeProblemAuthor,
  verifyRefreshToken,
  authorizeSubmissionAuthor,
};

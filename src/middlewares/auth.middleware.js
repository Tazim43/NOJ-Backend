import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError";
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { User } from "../models/User.model";

// Check if the user is authenticated using JWT token in the request header or cookie
exports.authenticate = async (req, _, next) => {
  try {
    // Get the token from the request header or cookie
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN);
    }

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET); // verify the token
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
};

// Authorize roles
exports.authorize = (...roles) => {
  return (req, _, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN);
    }
    next();
  };
};

// Verify refresh token in the request cookie and attach the user to the request object
exports.verifyRefreshToken = async (req, _, next) => {
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
};

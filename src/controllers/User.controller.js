import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../utils/responseHandler.js";

import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const googleCallback = asyncHandler(async (req, res) => {
  const code = req.query?.code;

  if (!code) {
    return ResponseHandler.error(
      res,
      [],
      "Google authentication code is required",
      StatusCodes.BAD_REQUEST
    );
  }

  try {
    const { tokens } = await client.getToken(code);

    if (!tokens || !tokens.id_token) {
      return ResponseHandler.error(
        res,
        [],
        "Failed to retrieve tokens from Google",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;
    if (!email) {
      res.redirect(`${process.env.CLIENT_URL}?error=Invalid Google user data`);
    }

    let user = await User.findOne({ email: email });

    if (!user) {
      const query = {
        email: email,
        username: email.split("@")[0],
        fullName: name,
        avatarUrl: picture,
        googleId: sub,
      };

      user = await User.create(query);
    }

    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.googleId = sub;
    user.avatarUrl = picture;
    user.fullName = name;

    await user.save();

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    console.log("User logged in successfully:", user.email);

    res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
  } catch (error) {
    return ResponseHandler.error(
      res,
      [error],
      "Failed to exchange Google authentication code",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user?._id;
  if (!user) {
    return ResponseHandler.error(
      res,
      [],
      "User not Provided",
      StatusCodes.NOT_FOUND
    );
  }

  const foundUser = await User.findById(user);
  if (!foundUser) {
    return ResponseHandler.error(
      res,
      [],
      "User not found",
      StatusCodes.NOT_FOUND
    );
  }

  foundUser.refreshToken = null;
  foundUser.accessToken = null;
  await foundUser.save();

  const isProduction = process.env.NODE_ENV === "production";

  // Clear cookies with same options as when they were set
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return ResponseHandler.success(
    res,
    [],
    "User logged out successfully",
    StatusCodes.OK
  );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    return ResponseHandler.error(
      res,
      [],
      "User not found",
      StatusCodes.NOT_FOUND
    );
  }

  const userData = {
    _id: user._id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    googleId: user.googleId,
    role: user.role,
    bio: user.bio,
    organization: user.organization,
    country: user.country,
    rating: user.rating,
    solvedCount: user.solvedCount,
    createdAt: user.createdAt,
  };

  return ResponseHandler.success(
    res,
    userData,
    "Current user retrieved successfully",
    StatusCodes.OK
  );
});

export { googleCallback, logoutUser, getCurrentUser };

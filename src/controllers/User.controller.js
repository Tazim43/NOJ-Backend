import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";
import userValidationSchema from "../validation/userValidationSchema.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import apiError from "../utils/apiError.js";
import fs from "fs";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

const registerUser = asyncHandler(async (req, res) => {
  const userData = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    fullName: req.body.fullName,
    avatarUrl: req.file?.path,
  };

  const validationResult = userValidationSchema.safeParse(userData);

  if (!validationResult.success) {
    if (userData.avatarUrl) {
      fs.unlinkSync(userData.avatarUrl);
    }

    throw new apiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      validationResult.error.errors
    );
  }

  // Check if user already exists
  const userExists = await User.findOne({
    $or: [{ username: userData.username }, { email: userData.email }],
  });
  if (userExists) {
    if (userData.avatarUrl) fs.unlinkSync(userData.avatarUrl);
    return res.status(400).json({ msg: "User already exists" });
  }

  // Upload avatar to Cloudinary and get the URL
  if (userData.avatarUrl) {
    userData.avatarUrl = await uploadOnCloudinary(
      userData.avatarUrl,
      "avatars"
    );
  }

  // Save user to database
  const newUser = new User(userData);

  await newUser.save();

  res.status(201).json({
    user: {
      id: newUser._id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      avatarUrl: newUser.avatarUrl,
    },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const userData = {
    email: req.body.email,
    password: req.body.password,
  };

  const validationResult = userValidationSchema
    .pick({
      email: true,
      password: true,
    })
    .safeParse(userData);

  if (!validationResult.success) {
    throw new apiError(
      StatusCodes.BAD_REQUEST,
      ReasonPhrases.BAD_REQUEST,
      validationResult.error.errors
    );
  }

  // Check if user exists
  const user = await User.findOne({ email: userData.email });
  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Invalid credentials" });
  }

  // Check if password is correct
  const isPasswordValid = await user.isPasswordCorrect(userData.password);
  if (!isPasswordValid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Invalid credentials" });
  }

  // Generate JWT token
  const token = user.generateAccessToken();

  // Generate refresh token
  const refreshToken = user.generateRefreshToken();

  // Save refresh token to database
  user.refreshToken = refreshToken;

  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // Cookie cannot be accessed by client-side scripts
    secure: true, // Cookie will only be sent over HTTPS
    sameSite: "strict", // Cookie will only be sent to the same site
  });

  res.json({
    user: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
    },
    token,
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const changePassword = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

export {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  refreshToken,
  verifyEmail,
  changePassword,
};

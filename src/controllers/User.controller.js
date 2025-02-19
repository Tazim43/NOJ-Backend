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
    avatar: req.files?.avatar,
  };

  const validationResult = userValidationSchema.safeParse(userData);

  if (!validationResult.success) {
    if (userData.avatar) fs.unlinkSync(userData.avatar);

    console.log("check");

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
    if (userData.avatar) fs.unlinkSync(userData.avatar);
    return res.status(400).json({ msg: "User already exists" });
  }

  // Upload avatar to Cloudinary and get the URL
  let avatarUrl = "";
  if (userData.avatar) {
    const result = await uploadOnCloudinary(userData.avatar, "avatars");
    avatarUrl = result.secure_url;
  }

  // Save user to database
  const newUser = new User(userData);

  await newUser.save();

  res.status(201).json({
    user: {
      id: newUser._id,
      username: newUser.username,
      fullNam: newUser.fullName,
      email: newUser.email,
      avatar: newUser.avatar,
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
    secure: process.env.NODE_ENV === "production", // Cookie will only be set on HTTPS
    sameSite: "none", // Cookie will be sent in cross-origin requests
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

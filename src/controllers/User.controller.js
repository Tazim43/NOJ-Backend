import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";
import userValidationSchema from "../validation/userValidationSchema.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import apiError from "../utils/apiError.js";
import fs from "fs";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../utils/responseHandler.js";

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
      "Invalid user data",
      validationResult.error.errors
    );
  }

  // Check if user already exists
  const userExists = await User.findOne({
    $or: [{ username: userData.username }, { email: userData.email }],
  });
  if (userExists) {
    if (userData.avatarUrl) fs.unlinkSync(userData.avatarUrl);
    return ResponseHandler.error(
      res,
      [],
      "User already exists",
      StatusCodes.BAD_REQUEST
    );
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

  // res, data = {}, message = "successfull", statusCode = 200
  return ResponseHandler.success(
    res,
    {
      user: {
        id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl,
      },
    },
    "User created successfully",
    StatusCodes.CREATED
  );
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
      "Invalid email or password",
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
    return ResponseHandler.error(
      res,
      [],
      "Invalid credentials",
      StatusCodes.BAD_REQUEST
    );
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

  // res, data = {}, message = "successfull", statusCode = 200
  return ResponseHandler.success(
    res,
    {
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
      },
      token,
    },
    "Login successful",
    StatusCodes.OK
  );
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

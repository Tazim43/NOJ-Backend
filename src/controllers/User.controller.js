import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

exports.registerUser = asyncHandler(async (req, res) => {
  // TODO: Get user details from frontend (req.body)
  const { username, email, password, avatar } = req.body;

  // TODO: Validate user details (ensure fields are not empty)
  if (!username || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  // TODO: Check if user already exists (by username or email)
  const userExists = await User.findOne({ $or: [{ username }, { email }] });

  if (userExists) {
    return res.status(400).json({ msg: "User already exists" });
  }

  // TODO: check of images, check for avatar
  // TODO: upload them to cloudinary

  let avatarUrl = "";
  if (avatar) {
    const result = await cloudinary.uploader.upload(avatar, {
      folder: "avatars",
    });
    avatarUrl = result.secure_url;
  }

  // TODO: Save user to database
  const newUser = new User({
    username,
    email,
    password,
    avatar: avatarUrl,
  });

  await newUser.save();

  // TODO: Generate JWT token for authentication
  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  // TODO: Send success response with user details (excluding password)
  res.status(201).json({
    token,
    user: {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      avatar: newUser.avatar,
    },
  });

  res.json({
    msg: "TODO",
  });
});

exports.loginUser = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

exports.logoutUser = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

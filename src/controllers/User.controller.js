import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, avatar } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  // Check if user already exists
  const userExists = await User.findOne({ $or: [{ username }, { email }] });
  if (userExists) {
    return res.status(400).json({ msg: "User already exists" });
  }

  // Upload avatar to Cloudinary and get the URL

  let avatarUrl = "";
  if (avatar) {
    const result = await uploadOnCloudinary(avatar, "avatars");
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

const loginUser = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
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

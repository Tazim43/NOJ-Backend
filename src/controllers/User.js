import { asyncHandler } from "../utils/asyncHandler.js";

const registerController = asyncHandler(async (req, res) => {
  // TODO: Get user details from frontend (req.body)

  // TODO: Validate user details (ensure fields are not empty)

  // TODO: Check if user already exists (by username or email)

  // TODO: check of images, check for avatar

  // TODO: upload them to cloudinary

  // TODO: If user exists, return an error response

  // TODO: Save user to database

  // TODO: Generate JWT token for authentication

  // TODO: Send success response with user details (excluding password)

  res.json({
    msg: "TODO",
  });
});

const loginController = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const logoutController = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const resetPasswordController = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const refreshTokenController = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const verifyEmailController = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const changePasswordController = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

export {
  loginController,
  logoutController,
  changePasswordController,
  registerController,
  resetPasswordController,
  refreshTokenController,
  verifyEmailController,
};

import { asyncHandler } from "../utils/asyncHandler.js";

const registerController = asyncHandler(async (req, res) => {
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

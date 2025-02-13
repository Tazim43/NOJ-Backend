import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  refreshToken,
  changePassword,
} from "../controllers/User.controller.js";
import {
  authenticate,
  authorize,
  verifyRefreshToken,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(authenticate, logoutUser);
router.route("/reset-password").post(authenticate, resetPassword);
router.route("refresh-token").post(verifyRefreshToken, refreshToken);
router.route("/change-password").post(authenticate, changePassword);

export default router;

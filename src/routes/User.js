import { Router } from "express";
import {
  changePasswordController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resetPasswordController,
  verifyEmailController,
} from "../controllers/User.js";

const router = Router();

// TODO : add auth middlewares

router.route("/register").post(registerController);
router.route("/login").post(loginController);
router.route("/logout").post(logoutController);
router.route("/reset-password").post(resetPasswordController);
router.route("/refresh-token").post(refreshTokenController);
router.route("/verify-email").post(verifyEmailController);
router.route("/change-password").post(changePasswordController);

export default router;

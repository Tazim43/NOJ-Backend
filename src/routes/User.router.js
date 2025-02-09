import { Router } from "express";
import userController from "../controllers/User.controller.js";

const router = Router();

// TODO : add auth middlewares

router.route("/register").post(userController.registerUser);
router.route("/login").post(userController.loginUser);
router.route("/logout").post(userController.logoutUser);
router.route("/reset-password").post(userController.resetPassword);
router.route("/refresh-token").post(userController.refreshToken);
router.route("/verify-email").post(userController.verifyEmail);
router.route("/change-password").post(userController.changePassword);

export default router;

import { Router } from "express";
import {
  googleCallback,
  logoutUser,
  getCurrentUser,
} from "../controllers/User.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/google/callback").get(googleCallback);
router.route("/me").get(authenticate, getCurrentUser);
router.route("/logout").post(authenticate, logoutUser);

export default router;

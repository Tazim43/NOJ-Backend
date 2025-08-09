import express from "express";

import {
  getAllSubmissions,
  getAllSubmissionsOfUser,
  getAllSubmissionsOfProblem,
  submitSolution,
  getSubmissionDetails,
  rejudgeSubmission,
  rejudgeAllSubmissionsForProblem,
  getSubmissionStatus,
  toggleSubmissionVisibility,
} from "../controllers/Submission.controller.js";

import {
  authenticate,
  authorize,
  authorizeSubmissionAuthor,
} from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants.js";

const router = express.Router();

// Main Route : BASE_URL/submissions

// get all submissions (public)
router.route("/").get(getAllSubmissions);

// get all submissions of the user
router.route("/my").get(authenticate, getAllSubmissionsOfUser);
router
  .route("/problems/:id")
  .get(getAllSubmissionsOfProblem)
  .post(authenticate, submitSolution); // create & submit a new submission

router.route("/:subID").get(authorizeSubmissionAuthor, getSubmissionDetails);

router.route("/:subID/rejudge").put(authorize(ROLES.ADMIN), rejudgeSubmission);

router
  .route("/problems/:id/rejudge")
  .post(authorize(ROLES.ADMIN), rejudgeAllSubmissionsForProblem);

router
  .route("/:subID/status")
  .get(authorizeSubmissionAuthor, getSubmissionStatus);

router
  .route("/:subID/visibility")
  .post(authorize(ROLES.ADMIN), toggleSubmissionVisibility);

export default router;

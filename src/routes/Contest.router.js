import express from "express";
import {
  createContest,
  updateContest,
  deleteContest,
  getAllContests,
  getContestById,
  getMyContests,
  registerForContest,
  unregisterFromContest,
  getContestProblems,
  getContestSubmissions,
  getContestLeaderboard,
  addProblemToContest,
  removeProblemFromContest,
  publishResults,
  createClarification,
  getClarifications,
  answerClarification,
  createAnnouncement,
  getAnnouncements,
} from "../controllers/Contest.controller.js";

import {
  authenticate,
  authorize,
  authorizeContestCreator,
  optionalAuthenticate,
} from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants.js";

const router = express.Router();

// Main Route: BASE_URL/contests

// Public routes
router
  .route("/")
  .get(getAllContests)
  .post(
    authenticate,
    authorize([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
    createContest
  );

router.route("/my").get(authenticate, getMyContests);

router
  .route("/:id")
  .get(optionalAuthenticate, getContestById)
  .put(authenticate, authorizeContestCreator, updateContest)
  .delete(authenticate, authorizeContestCreator, deleteContest);

// Contest problems - public for ongoing/ended contests
router
  .route("/:id/problems")
  .get(optionalAuthenticate, getContestProblems)
  .post(authenticate, authorizeContestCreator, addProblemToContest);

router
  .route("/:id/problems/:problemId")
  .delete(authenticate, authorizeContestCreator, removeProblemFromContest);

// Registration
router
  .route("/:id/register")
  .post(authenticate, registerForContest)
  .delete(authenticate, unregisterFromContest);

// Submissions & Leaderboard - public view for ongoing/ended contests
router
  .route("/:id/submissions")
  .get(optionalAuthenticate, getContestSubmissions);
router.route("/:id/leaderboard").get(getContestLeaderboard);

// Results
router
  .route("/:id/publish-results")
  .post(
    authenticate,
    authorize([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
    publishResults
  );

// Clarifications
router
  .route("/:id/clarifications")
  .get(authenticate, getClarifications)
  .post(authenticate, createClarification);

router
  .route("/:id/clarifications/:clarId")
  .put(authenticate, authorizeContestCreator, answerClarification);

// Announcements - public read, admin create
router
  .route("/:id/announcements")
  .get(getAnnouncements)
  .post(authenticate, authorizeContestCreator, createAnnouncement);

export default router;

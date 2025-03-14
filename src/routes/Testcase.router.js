import express from "express";

import {
  getAllTestcases,
  createTestcase,
  updateTestcase,
  deleteTestcase,
  getTestcaseById,
} from "../controllers/Testcase.controller.js";
import {
  authenticate,
  authorizeProblemAuthor,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Main Route : BASE_URL/testcases

router
  .route("/problem/:id")
  .get(authenticate, authorizeProblemAuthor, getAllTestcases)
  .post(authenticate, authorizeProblemAuthor, createTestcase);

router
  .route("/problem/:id/testcase/:tcId")
  .get(authenticate, authorizeProblemAuthor, getTestcaseById)
  .put(authenticate, authorizeProblemAuthor, updateTestcase)
  .delete(authenticate, authorizeProblemAuthor, deleteTestcase);

export default router;

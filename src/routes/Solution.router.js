import express from "express";

import {
  getSolution,
  createSolution,
  getSolutionById,
  updateSolution,
  deleteSolution,
} from "../controllers/Solution.controller.js";
import {
  authenticate,
  authorizeProblemAuthor,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Main Route : BASE_URL/solutions

router
  .route("/problem/:id")
  .get(authenticate, authorizeProblemAuthor, getSolution)
  .post(authenticate, authorizeProblemAuthor, createSolution);

router
  .route("/:id/:solId")
  .get(authenticate, authorizeProblemAuthor, getSolutionById)
  .put(authenticate, authorizeProblemAuthor, updateSolution)
  .delete(authenticate, authorizeProblemAuthor, deleteSolution);

export default router;

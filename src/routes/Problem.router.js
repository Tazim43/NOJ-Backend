import express from "express";
import {
  getAllProblems,
  createProblem,
  getProblemById,
  updateProblem,
  deleteProblem,
  updateProblemVisibility,
} from "../controllers/Problem.controller.js";

const router = express.Router();

router.route("/").get(getAllProblems).post(createProblem); // user role

router
  .route("/:id")
  .get(getProblemById)
  .put(updateProblem) // user role
  .delete(deleteProblem); // user role

router.route("/:id/visibility").put(updateProblemVisibility); // user role

export default router;

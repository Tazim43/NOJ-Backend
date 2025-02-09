import express from "express";
import ProblemController from "../controllers/ProblemController";

const router = express.Router();

router
  .route("/")
  .get(ProblemController.getAllProblems)
  .post(ProblemController.createProblem); // user role

router
  .route("/:id")
  .get(ProblemController.getProblemById)
  .put(ProblemController.updateProblem) // user role
  .delete(ProblemController.deleteProblem); // user role

router.route("/:id/visibility").put(ProblemController.updateProblemVisibility); // user role

export default router;

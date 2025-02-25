import express from "express";
import {
  getAllProblems,
  createProblem,
  createProblemStatement,
  getProblemById,
  getProblemStatementById,
  updateProblem,
  updateProblemStatement,
  deleteProblem,
  updateProblemVisibility,
} from "../controllers/Problem.controller.js";

import {
  authenticate,
  authorizeProblemAuthor,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import multerError from "../middlewares/multerError.js";

const router = express.Router();

// Main Route : BASE_URL/problems

// get all problems : public, create problem : user
router.route("/").get(getAllProblems).post(authenticate, createProblem);

router
  .route("/:id")
  .get(getProblemById) // get problem by id : public
  .put(authenticate, authorizeProblemAuthor, updateProblem) // update problem : author
  .delete(authenticate, authorizeProblemAuthor, deleteProblem); // delete problem : author

router
  .route("/:id/statement")
  .get(authenticate, authorizeProblemAuthor, getProblemStatementById) // QQ : is it necessary? | for testing purpose
  .post(
    upload.array("imageList", 5),
    authenticate,
    authorizeProblemAuthor,
    createProblemStatement,
    multerError
  )
  .put(authenticate, authorizeProblemAuthor, updateProblemStatement);

router
  .route("/:id/visibility")
  .put(authenticate, authorizeProblemAuthor, updateProblemVisibility); // update problem visibility : author

export default router;

import express from "express";
import { BASEURL, LIMIT } from "./constants.js";
import cookieParser from "cookie-parser";

const app = express();

// app config
app.use(express.json({ limit: LIMIT }));
app.use(express.urlencoded({ limit: LIMIT }));
app.use(express.static("public"));
app.use(cookieParser());

// import routes
import UserRouter from "./routes/User.router.js";
import ProblemRouter from "./routes/Problem.router.js";
import SolutionRouter from "./routes/Solution.router.js";
import SubmissionRouter from "./routes/Submission.router.js";
import TestcaseRouter from "./routes/Testcase.router.js";

// define routes
app.use(`${BASEURL}/auth`, UserRouter);
app.use(`${BASEURL}/problems`, ProblemRouter);
app.use(`${BASEURL}/solutions`, SolutionRouter);
app.use(`${BASEURL}/submissions`, SubmissionRouter);
app.use(`${BASEURL}/testcases`, TestcaseRouter);

import { StatusCodes, ReasonPhrases } from "http-status-codes";
import ApiError from "./utils/apiError.js";

// Custom error-handling middleware
app.use((err, req, res, next) => {
  // Check if the error is an instance of ApiError
  if (err instanceof ApiError) {
    console.log("msg : ", err.message);
    console.log("errors : ", err.errors);
    console.log("stack : ", err.stack);
    return res.status(err.status).json({
      status: err.status,
      success: err.success,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err.status == 413 || err.type === "entity.too.large") {
    return res.status(StatusCodes.REQUEST_TOO_LONG).json({
      status: err.status,
      success: err.success,
      message: err.message,
      errors: err.errors,
    });
  }

  console.log("new error", err.message);
  console.log("new errors: ", err.errors);
  console.log("new stack: ", err.stack);
  // Handle other types of errors
  return res.status().json({
    hint: "Final error",
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    message: ReasonPhrases.INTERNAL_SERVER_ERROR,
    errors: err.errors,
  });
});

app.get(`${BASEURL}/`, (req, res) => {
  res.json({
    msg: "Wellcome to NaiveOJ v1.0",
  });
});

export default app;

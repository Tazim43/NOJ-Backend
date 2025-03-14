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
    console.log("msg:", err.message);
    console.log("errors:", err.errors || "No additional errors");
    console.log("stack:", err.stack);

    return res.status(err.statusCode || 500).json({
      status: err.statusCode || 500,
      message: err.message,
      errors: err.errors || null,
    });
  }

  // Handle payload too large error
  if (err.status === 413 || err.type === "entity.too.large") {
    return res.status(StatusCodes.REQUEST_TOO_LONG).json({
      status: StatusCodes.REQUEST_TOO_LONG,
      message: "Payload too large",
      errors: err.errors || null,
    });
  }

  // Log all other errors
  console.error("Unhandled error:", err);

  // Handle other unknown errors
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    message: ReasonPhrases.INTERNAL_SERVER_ERROR,
    errors: err.errors || null,
  });
});

app.get(`${BASEURL}/`, (req, res) => {
  res.json({
    msg: "Wellcome to NaiveOJ v1.0",
  });
});

export default app;

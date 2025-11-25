import express from "express";
import { BASEURL, LIMIT } from "./constants.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS.split(",").map(
  (origin) => origin.trim()
);
const credentials = process.env.CORS_CREDENTIALS === "true"; // Convert to boolean

// app config
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: credentials,
  })
); // enable cors
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
import ContestRouter from "./routes/Contest.router.js";

// define routes
app.use(`${BASEURL}/auth`, UserRouter);
app.use(`${BASEURL}/problems`, ProblemRouter);
app.use(`${BASEURL}/solutions`, SolutionRouter);
app.use(`${BASEURL}/submissions`, SubmissionRouter);
app.use(`${BASEURL}/testcases`, TestcaseRouter);
app.use(`${BASEURL}/contests`, ContestRouter);

import { StatusCodes, ReasonPhrases } from "http-status-codes";
import ApiError from "./utils/apiError.js";
import ResponseHandler from "./utils/responseHandler.js";

// Custom error-handling middleware
app.use((err, req, res, next) => {
  // Check if the error is an instance of ApiError
  if (err instanceof ApiError) {
    console.log("msg:", err.message);
    console.log("errors:", err.errors || "No additional errors");
    console.log("stack:", err.stack);

    // res, error = [], message = "something went wrong", statutCode = 500
    return ResponseHandler.error(res, err.errors, err.message, err.statusCode);
  }

  // Handle payload too large error
  if (err.status === 413 || err.type === "entity.too.large") {
    return ResponseHandler.error(
      res,
      err.errors,
      ReasonPhrases.REQUEST_TOO_LONG,
      StatusCodes.REQUEST_TOO_LONG
    );
  }

  // Log all other errors
  console.error("Unhandled error:", err);

  // Handle other unknown errors
  return ResponseHandler.error(
    res,
    err.errors,
    ReasonPhrases.INTERNAL_SERVER_ERROR,
    StatusCodes.INTERNAL_SERVER_ERROR
  );
});

app.get(`${BASEURL}/`, (req, res) => {
  res.json({
    msg: "Wellcome to NaiveOJ v1.0",
  });
});

export default app;

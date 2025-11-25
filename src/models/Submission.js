import mongoose from "mongoose";
import { VERDICTS } from "../constants.js";

const SubmissionSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: [true, "problemId is required"],
    },
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    languageId: {
      type: Number,
      required: [true, "languageId is required"],
    },
    source_code: {
      type: String,
      required: [true, "source_code is required"],
    },
    finalVerdict: {
      type: String,
      enum: [
        VERDICTS.AC,
        VERDICTS.WA,
        VERDICTS.TLE,
        VERDICTS.MLE,
        VERDICTS.RE,
        VERDICTS.CE,
        VERDICTS.SKIPPED,
        VERDICTS.PENDING,
      ],
      default: VERDICTS.PENDING,
    },
    testCaseResults: [
      {
        token: {
          type: String,
          required: [true, "token for testCaseResults is required"],
        },
        verdict: {
          type: String,
          enum: [
            VERDICTS.AC,
            VERDICTS.WA,
            VERDICTS.TLE,
            VERDICTS.MLE,
            VERDICTS.RE,
            VERDICTS.CE,
            VERDICTS.SKIPPED,
            VERDICTS.PENDING,
          ],
          default: "PENDING",
        },
        executionTime: Number,
        memoryUsed: Number,
      },
    ],
    executionTime: {
      type: Number,
      default: 0,
    },
    memoryUsed: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Submission", SubmissionSchema);

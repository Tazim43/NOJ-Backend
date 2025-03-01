import mongoose from "mongoose";

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
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    language: {
      type: String,
      required: [true, "language is required"],
    },
    code: {
      type: String,
      required: [true, "code is required"],
    },
    status: {
      type: String,
      required: [true, "status is required"],
    },
    executionTime: {
      type: Number,
      required: [true, "executionTime is required"],
    },
    memoryUsed: {
      type: Number,
      required: [true, "memoryUsed is required"],
    },
    verdictDetails: {
      type: String,
      required: [true, "verdictDetails is required"],
    },
    testCaseResults: [
      {
        testCaseId: String,
        status: String,
        executionTime: Number,
        memoryUsed: Number,
      },
    ],
    rejudged: {
      type: Boolean,
      default: false,
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

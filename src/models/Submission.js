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
    languageId: {
      type: Number,
      required: [true, "languageId is required"],
    },
    source_code: {
      type: String,
      required: [true, "source_code is required"],
    },
    stdin: {
      type: String,
      default: null,
    },
    stdout: {
      type: String,
      default: null,
    },
    stderr: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: [true, "status is required"],
    },
    cpu_time_limit: {
      type: Number,
      required: [true, "cpu_time_limit is required"],
    },
    memory_limit: {
      type: Number,
      required: [true, "memory_limit is required"],
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

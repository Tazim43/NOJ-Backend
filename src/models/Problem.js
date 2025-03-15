import mongoose from "mongoose";

const ProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: [true, "title is required"],
    },
    timeLimit: {
      type: Number,
      required: [true, "timeLimit is required in ms"],
    },
    memoryLimit: {
      type: Number,
      required: [true, "memoryLimit is required"],
    },
    statementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProblemStatement",
    },
    authorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "authorId is required"],
      },
    ],
    testcaseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Testcase",
      },
    ],
    solutionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Solution",
      },
    ],
    validatorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Validator",
      },
    ],
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
    },
    submissionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
    },
    solveCount: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },

    isContestProblem: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    acceptanceRate: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Problem", ProblemSchema);

import mongoose from "mongoose";

const ProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: [true, "title is required"],
    },
    statementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProblemStatement",
      required: [true, "statementId is required"],
    },
    tags: [
      {
        type: String,
      },
    ],
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "authorId is required"],
    },
    solveCount: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
    timeLimit: {
      type: Number,
      required: [true, "timeLimit is required"],
    },
    memoryLimit: {
      type: Number,
      required: [true, "memoryLimit is required"],
    },
    isContestProblem: {
      type: Boolean,
      default: false,
    },
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
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

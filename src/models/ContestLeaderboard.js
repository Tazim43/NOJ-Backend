import mongoose from "mongoose";

const ContestLeaderboardSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: [true, "ContestId is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    score: {
      type: Number,
      default: 0,
    },
    penalty: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    problemsSolved: [
      {
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Problem",
        },
        score: {
          type: Number,
          default: 0,
        },
        attempts: {
          type: Number,
          default: 0,
        },
        solvedAt: {
          type: Date,
        },
        penaltyTime: {
          type: Number,
          default: 0,
        },
      },
    ],
    lastSubmissionTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

ContestLeaderboardSchema.index({ contestId: 1, rank: 1 });
ContestLeaderboardSchema.index({ contestId: 1, userId: 1 }, { unique: true });

export default mongoose.model("ContestLeaderboard", ContestLeaderboardSchema);

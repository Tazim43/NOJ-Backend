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
      required: [true, "score is required"],
    },
    penalty: {
      type: Number,
      required: [true, "penalty is required"],
    },
    rank: {
      type: Number,
      required: [true, "rank is required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContestLeaderboard", ContestLeaderboardSchema);

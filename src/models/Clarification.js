import mongoose from "mongoose";

const ClarificationSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: [true, "contestId is required"],
      index: true,
    },
    question: {
      type: String,
      required: [true, "question is required"],
    },
    answer: {
      type: String,
      default: null,
    },
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "askedBy is required"],
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Clarification", ClarificationSchema);

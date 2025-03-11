import mongoose from "mongoose";

const SolutionSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: [true, "problemId is required"],
    },
    languageId: {
      type: Number,
      required: [true, "language is required"],
    },
    source_code: {
      type: String,
      required: [true, "code is required"],
    },
    isOptimal: {
      type: Boolean,
      default: false,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "authorId is required"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Solution", SolutionSchema);

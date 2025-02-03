import mongoose from "mongoose";

const ValidatorSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: [true, "problemID is required"],
    },
    language: {
      type: String,
      required: [true, "language is required"],
    },
    code: {
      type: String,
      required: [true, "code is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Validator", ValidatorSchema);

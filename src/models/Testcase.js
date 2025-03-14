import mongoose from "mongoose";

const TestcaseSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: [true, "Problem ID is required"],
    },
    input: {
      type: String,
      required: [true, "Input is required"],
    },
    expectedOutput: {
      type: String,
      required: [true, "Expected Output is required"],
    },
    isSample: {
      type: Boolean,
      default: false,
    },
    cpu_time: {
      type: Number,
    },
    memory: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Testcase", TestcaseSchema);

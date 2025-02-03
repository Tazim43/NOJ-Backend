import mongoose from "mongoose";

const ProblemStatementSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "description is required"],
    },
    constraints: {
      type: String,
      required: [true, "constraints is required"],
    },
    inputDescription: {
      type: String,
      required: [true, "inputDescription is required"],
    },
    outputDescription: {
      type: String,
      required: [true, "outputDescription is required"],
    },
    notes: {
      type: String,
    },
    samples: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Testcase",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ProblemStatement", ProblemStatementSchema);

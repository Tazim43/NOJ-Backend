import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      requried: [true, "userId is required"],
    },
    feedback: {
      type: String,
      requried: [true, "feedback is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", FeedbackSchema);

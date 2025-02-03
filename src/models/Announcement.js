import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: [true, "contestId is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "message is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdBy is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", AnnouncementSchema);

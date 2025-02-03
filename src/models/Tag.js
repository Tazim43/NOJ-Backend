import mongoose from "mongoose";

const TagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "name is required"],
    },
    description: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Tag", TagSchema);

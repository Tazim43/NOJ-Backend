import mongoose from "mongoose";

const ContestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      unique: true,
      required: [true, "title is required"],
    },
    description: {
      type: String,
      required: [true, "description is required"],
    },
    problems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    startTime: {
      type: Date,
      required: [true, "startTime is required"],
    },
    endTime: {
      type: Date,
      required: [true, "endTime is required"],
    },
    timeZone: {
      type: String,
      required: [true, "timeZone is required"],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    accessCode: {
      type: String,
      nullable: true,
    },
    contestType: {
      type: String,
      required: [true, "contestType is required"],
    },
    scoringRules: {
      type: String,
      enum: ["ICPC", "IOI", "Custom"],
      required: [true, "scoringRules is required"],
    },
    registrationStartTime: {
      type: Date,
      required: [true, "registrationStartTime is required"],
    },
    registrationEndTime: {
      type: Date,
      required: [true, "registrationEndTime is required"],
    },
    registeredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxParticipants: {
      type: Number,
      nullable: true,
    },
    allowLateJoin: {
      type: Boolean,
      default: false,
    },
    resultsPublished: {
      type: Boolean,
      default: false,
    },
    isPractice: {
      type: Boolean,
      default: false,
    },
    freezeStartTime: {
      type: Date,
      nullable: true,
    },
    freezeEndTime: {
      type: Date,
      nullable: true,
    },
    freezeDuration: {
      type: Number,
      nullable: true,
    },
    clarificationsEnabled: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdBy is required"],
    },
    problemOrder: [
      {
        type: String,
      },
    ],
    problemScores: [
      {
        type: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

ContestSchema.index({ startTime: 1, isVisible: 1 });
ContestSchema.index({ createdBy: 1 });
ContestSchema.index({ registeredUsers: 1 });

export default mongoose.model("Contest", ContestSchema);

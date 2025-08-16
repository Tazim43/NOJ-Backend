import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: [true, "Google ID is required"],
      unique: [true, "Google ID already exists"],
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, "username is required"],
      unique: [true, "username already exists"],
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: [true, "email already exists"],
      lowercase: true,
      trim: true,
      index: true,
    },
    accessToken: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "super-admin"],
      default: "user",
    },
    fullName: {
      type: String,
      required: [true, "full name is required"],
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: "", // TODO : add default avatar url
    },
    bio: {
      type: String,
    },
    organization: {
      type: String,
    },
    country: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
    solvedCount: {
      type: Number,
      default: 0,
    },
    languagePreference: {
      type: String,
      default: "English",
    },
    lastLogin: {
      type: Date,
    },
    resetToken: {
      type: String,
      default: null,
    },
    solvedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],
    submissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
      },
    ],
    contestsParticipated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contest",
      },
    ],
    bookmarkedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],
    authoredProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.generateAccessToken = function () {
  console.log("Generating access token for user:", this._id);

  const token = jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  console.log("Access token generated:", token);

  return token;
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });
};

export default mongoose.model("User", UserSchema);

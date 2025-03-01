import { asyncHandler } from "../utils/asyncHandler";

// Get all submissions of the logged-in user
const getAllSubmissionsOfUser = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Get all submissions of a specific problem
const getAllSubmissionsOfProblem = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Submit a solution for a problem
const submitSolution = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Get details of a specific submission. if user, show it or check if it is public or not
const getSubmissionDetails = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Rejudge a specific submission | only for admin
const rejudgeSubmission = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Rejudge all submissions for a problem | only for admin
const rejudgeAllSubmissionsForProblem = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Get the status of a submission (queued, running, judged)
const getSubmissionStatus = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

// Toggle the visibility of a submission
const toggleSubmissionVisibility = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

export {
  getAllSubmissionsOfUser,
  getAllSubmissionsOfProblem,
  submitSolution,
  getSubmissionDetails,
  rejudgeSubmission,
  rejudgeAllSubmissionsForProblem,
  getSubmissionStatus,
  toggleSubmissionVisibility,
};

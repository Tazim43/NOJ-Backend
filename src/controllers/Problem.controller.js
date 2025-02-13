import { asyncHandler } from "../utils/asyncHandler.js";

const getAllProblems = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const getProblemById = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const createProblem = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const updateProblem = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const deleteProblem = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

const updateProblemVisibility = asyncHandler(async (req, res) => {
  res.json({
    msg: "TODO",
  });
});

export {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  updateProblemVisibility,
};

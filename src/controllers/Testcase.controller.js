import { asyncHandler } from "../utils/asyncHandler.js";

// @route POST /api/testcases/problem/:id
// @desc get all testcases of a problem
const getAllTestcases = asyncHandler(async (req, res) => {
  res.json({ msg: "Get all testcases" });
});

// @route GET /api/testcases/problem/:id/testcase/:tcId
// @desc get a testcase by id
const getTestcaseById = asyncHandler(async (req, res) => {
  res.json({ msg: "Get a testcase by id" });
});

// @route POST /api/testcases/problem/:id
// @desc create a testcase
const createTestcase = asyncHandler(async (req, res) => {
  res.json({ msg: "Create a testcase" });
});

// @route PUT /api/testcases/problem/:id/testcase/:tcId
// @desc update a testcase
const updateTestcase = asyncHandler(async (req, res) => {
  res.json({ msg: "Update a testcase" });
});

// @route DELETE /api/testcases/problem/:id/testcase/:tcId
// @desc delete a testcase
const deleteTestcase = asyncHandler(async (req, res) => {
  res.json({ msg: "Delete a testcase" });
});

export {
  getAllTestcases,
  getTestcaseById,
  createTestcase,
  updateTestcase,
  deleteTestcase,
};

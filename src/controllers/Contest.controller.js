import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import Contest from "../models/Contest.js";
import Problem from "../models/Problem.js";
import ContestLeaderboard from "../models/ContestLeaderboard.js";
import Clarification from "../models/Clarification.js";
import Announcement from "../models/Announcement.js";
import Submission from "../models/Submission.js";
import {
  getContestStatus,
  canViewContestProblems,
  isLeaderboardFrozen,
  recalculateRanks,
} from "../utils/contestScoring.js";

// @Route : POST /api/v1/contests
// @DESC : Create a new contest (Admin only)
export const createContest = asyncHandler(async (req, res) => {
  // Validate required fields
  const {
    title,
    description,
    startTime,
    endTime,
    timeZone,
    contestType,
    scoringRules,
    registrationStartTime,
    registrationEndTime,
  } = req.body;

  if (
    !title ||
    !description ||
    !startTime ||
    !endTime ||
    !timeZone ||
    !contestType ||
    !scoringRules ||
    !registrationStartTime ||
    !registrationEndTime
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Missing required fields");
  }

  // Validate time logic
  const start = new Date(startTime);
  const end = new Date(endTime);
  const regStart = new Date(registrationStartTime);
  const regEnd = new Date(registrationEndTime);

  if (start >= end) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Start time must be before end time"
    );
  }

  if (regStart >= regEnd) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Registration start must be before registration end"
    );
  }

  if (regEnd > start) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Registration must end before contest starts"
    );
  }

  // Create contest
  const contestData = {
    ...req.body,
    createdBy: req.user._id,
    problems: req.body.problems || [],
    problemOrder: req.body.problemOrder || [],
    problemScores: req.body.problemScores || [],
  };

  const contest = await Contest.create(contestData);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Contest created successfully",
    contest,
  });
});

// @Route : GET /api/v1/contests
// @DESC : Get all contests with optional filters
export const getAllContests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  let query = { isVisible: true };
  const now = new Date();

  // Filter by status
  if (status === "upcoming") {
    query.startTime = { $gt: now };
  } else if (status === "ongoing") {
    query.startTime = { $lte: now };
    query.endTime = { $gte: now };
  } else if (status === "past") {
    query.endTime = { $lt: now };
  }

  const totalContests = await Contest.countDocuments(query);

  const contests = await Contest.find(query)
    .select(
      "_id title description startTime endTime contestType scoringRules isPrivate registeredUsers maxParticipants"
    )
    .populate("createdBy", "username fullName")
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Add contest status and participant count to each contest
  const enrichedContests = contests.map((contest) => ({
    ...contest,
    status: getContestStatus(contest),
    participantCount: contest.registeredUsers?.length || 0,
  }));

  const totalPages = Math.ceil(totalContests / limit);

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      contests: enrichedContests,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalContests,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit),
      },
    },
  });
});

// @Route : GET /api/v1/contests/:id
// @DESC : Get contest by ID
export const getContestById = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id)
    .populate("createdBy", "username fullName email")
    .populate("problems", "title difficulty tags")
    .lean();

  if (!contest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  // Check visibility and access
  let isCreator = false;
  let isAdmin = false;
  let isRegistered = false;

  if (req.user) {
    isCreator = contest.createdBy._id.toString() === req.user._id.toString();
    isAdmin =
      req.user.role === "admin" ||
      req.user.role === "super-admin" ||
      req.user.email === process.env.ADMIN_EMAIL;
    isRegistered = contest.registeredUsers?.some(
      (userId) => userId.toString() === req.user._id.toString()
    );
  }

  const isCreatorOrAdmin = isCreator || isAdmin;

  // If contest is not visible and user is not creator/admin, deny access
  if (!contest.isVisible && !isCreatorOrAdmin) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  // If contest is private and user is not registered/creator/admin, hide full details
  if (contest.isPrivate && !isRegistered && !isCreatorOrAdmin) {
    return res.status(StatusCodes.OK).json({
      success: true,
      contest: {
        _id: contest._id,
        title: contest.title,
        description: contest.description,
        startTime: contest.startTime,
        endTime: contest.endTime,
        contestType: contest.contestType,
        isPrivate: true,
        requiresAccessCode: !!contest.accessCode,
        status: getContestStatus(contest),
      },
    });
  }

  const contestStatus = getContestStatus(contest);
  const participantCount = contest.registeredUsers?.length || 0;

  res.status(StatusCodes.OK).json({
    success: true,
    contest: {
      ...contest,
      status: contestStatus,
      participantCount,
      isRegistered,
      isCreator,
    },
  });
});

// @Route : GET /api/v1/contests/my
// @DESC : Get contests created by or registered by the user
export const getMyContests = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get contests created by user
  const createdContests = await Contest.find({ createdBy: userId })
    .select(
      "_id title description startTime endTime contestType isVisible registeredUsers"
    )
    .sort({ startTime: -1 })
    .lean();

  // Get contests user is registered for
  const registeredContests = await Contest.find({
    registeredUsers: userId,
    createdBy: { $ne: userId },
  })
    .select(
      "_id title description startTime endTime contestType registeredUsers"
    )
    .sort({ startTime: -1 })
    .lean();

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      created: createdContests.map((c) => ({
        ...c,
        status: getContestStatus(c),
        participantCount: c.registeredUsers?.length || 0,
      })),
      registered: registeredContests.map((c) => ({
        ...c,
        status: getContestStatus(c),
        participantCount: c.registeredUsers?.length || 0,
      })),
    },
  });
});

// @Route : PUT /api/v1/contests/:id
// @DESC : Update contest (Creator/Admin only)
export const updateContest = asyncHandler(async (req, res) => {
  const contest = req.contest; // Set by authorizeContestCreator middleware

  const contestStatus = getContestStatus(contest);

  // Prevent updates if contest is ongoing
  if (contestStatus === "ONGOING") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot update contest while it is ongoing"
    );
  }

  // Validate time logic if times are being updated
  if (req.body.startTime || req.body.endTime) {
    const start = new Date(req.body.startTime || contest.startTime);
    const end = new Date(req.body.endTime || contest.endTime);

    if (start >= end) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Start time must be before end time"
      );
    }
  }

  const updatedContest = await Contest.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Contest updated successfully",
    contest: updatedContest,
  });
});

// @Route : DELETE /api/v1/contests/:id
// @DESC : Delete contest (Creator/Admin only)
export const deleteContest = asyncHandler(async (req, res) => {
  const contest = req.contest;

  const contestStatus = getContestStatus(contest);

  // Prevent deletion if contest is ongoing
  if (contestStatus === "ONGOING") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete contest while it is ongoing"
    );
  }

  // Check if there are submissions
  const submissionCount = await Submission.countDocuments({
    contestId: contest._id,
  });

  if (submissionCount > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete contest with existing submissions. Consider hiding it instead."
    );
  }

  // Delete related data
  await Promise.all([
    ContestLeaderboard.deleteMany({ contestId: contest._id }),
    Clarification.deleteMany({ contestId: contest._id }),
    Announcement.deleteMany({ contestId: contest._id }),
  ]);

  await Contest.findByIdAndDelete(req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Contest deleted successfully",
  });
});

// @Route : GET /api/v1/contests/:id/problems
// @DESC : Get problems in a contest
export const getContestProblems = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id).populate({
    path: "problems",
    select: "_id title difficulty timeLimit memoryLimit tags statementId",
    populate: {
      path: "statementId",
      select: "description inputDescription outputDescription",
    },
  });

  if (!contest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  const contestStatus = getContestStatus(contest);

  console.log("Contest ID:", contest._id);
  console.log("Contest Status:", contestStatus);
  console.log("Start Time:", contest.startTime);
  console.log("End Time:", contest.endTime);
  console.log("Current Time:", new Date());
  console.log("User:", req.user ? req.user.email : "Not authenticated");

  // For ONGOING or ENDED contests, allow public viewing
  const isPublicViewAllowed =
    contestStatus === "ONGOING" || contestStatus === "ENDED";

  // Check if user can view problems
  if (!isPublicViewAllowed) {
    // Only allow creators and admins to view upcoming contests
    if (!req.user) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Contest has not started yet");
    }

    const isCreator = contest.createdBy.toString() === req.user._id.toString();
    const isAdmin =
      req.user.role === "admin" || req.user.email === process.env.ADMIN_EMAIL;

    if (!isCreator && !isAdmin) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Contest has not started yet");
    }
  }

  // For authenticated users, check registration status for submission rights
  let isRegistered = false;
  let isCreator = false;
  let isAdmin = false;

  if (req.user) {
    isRegistered = contest.registeredUsers.some(
      (userId) => userId.toString() === req.user._id.toString()
    );
    isCreator = contest.createdBy.toString() === req.user._id.toString();
    isAdmin =
      req.user.role === "admin" || req.user.email === process.env.ADMIN_EMAIL;
  }

  // Map problems with contest labels (A, B, C, etc.)
  const problemsWithLabels = contest.problems.map((problem, index) => ({
    ...problem.toObject(),
    label: contest.problemOrder[index] || String.fromCharCode(65 + index), // A, B, C...
    score: contest.problemScores?.[index] || 100,
  }));

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      problems: problemsWithLabels,
      contestId: contest._id,
      contestTitle: contest.title,
      endTime: contest.endTime,
    },
  });
});

// @Route : POST /api/v1/contests/:id/problems
// @DESC : Add problem to contest (Creator/Admin only)
export const addProblemToContest = asyncHandler(async (req, res) => {
  const contest = req.contest;
  const { problemId, label, score } = req.body;

  // Prevent adding problems once contest has started
  const contestStatus = getContestStatus(contest);
  if (contestStatus === "ONGOING" || contestStatus === "ENDED") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot modify problems after contest has started"
    );
  }

  if (!problemId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Problem ID is required");
  }

  // Check if problem exists
  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Problem not found");
  }

  // Check if problem already in contest
  if (contest.problems.includes(problemId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Problem already in contest");
  }

  // Add problem
  contest.problems.push(problemId);
  contest.problemOrder.push(
    label || String.fromCharCode(65 + contest.problems.length - 1)
  );
  contest.problemScores.push(score || 100);

  await contest.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Problem added to contest",
    contest,
  });
});

// @Route : DELETE /api/v1/contests/:id/problems/:problemId
// @DESC : Remove problem from contest (Creator/Admin only)
export const removeProblemFromContest = asyncHandler(async (req, res) => {
  const contest = req.contest;
  const { problemId } = req.params;

  // Prevent removing problems once contest has started
  const contestStatus = getContestStatus(contest);
  if (contestStatus === "ONGOING" || contestStatus === "ENDED") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot modify problems after contest has started"
    );
  }

  // Check if there are submissions for this problem in the contest
  const submissionCount = await Submission.countDocuments({
    contestId: contest._id,
    problemId,
  });

  if (submissionCount > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot remove problem with existing submissions"
    );
  }

  // Find index of problem
  const problemIndex = contest.problems.findIndex(
    (p) => p.toString() === problemId
  );

  if (problemIndex === -1) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Problem not found in contest");
  }

  // Remove problem and corresponding order/score
  contest.problems.splice(problemIndex, 1);
  contest.problemOrder.splice(problemIndex, 1);
  contest.problemScores.splice(problemIndex, 1);

  await contest.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Problem removed from contest",
  });
});

// @Route : POST /api/v1/contests/:id/register
// @DESC : Register for a contest
export const registerForContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);

  if (!contest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  const contestStatus = getContestStatus(contest);
  const now = new Date();

  // Check if user is the creator
  if (contest.createdBy.toString() === req.user._id.toString()) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Contest creators cannot register for their own contest"
    );
  }

  // Check registration window
  if (
    now < contest.registrationStartTime ||
    now > contest.registrationEndTime
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Registration is not open");
  }

  // Check if already registered
  if (contest.registeredUsers.includes(req.user._id)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Already registered for this contest"
    );
  }

  // Check max participants
  if (
    contest.maxParticipants &&
    contest.registeredUsers.length >= contest.maxParticipants
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Contest has reached maximum participants"
    );
  }

  // Check access code for private contests
  if (contest.isPrivate) {
    if (!req.body.accessCode) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Access code is required for private contests"
      );
    }

    if (req.body.accessCode !== contest.accessCode) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Invalid access code");
    }
  }

  // Register user
  contest.registeredUsers.push(req.user._id);
  await contest.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Successfully registered for contest",
  });
});

// @Route : DELETE /api/v1/contests/:id/register
// @DESC : Unregister from a contest
export const unregisterFromContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);

  if (!contest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  const contestStatus = getContestStatus(contest);

  // Can only unregister before contest starts
  if (contestStatus !== "UPCOMING" && contestStatus !== "REGISTRATION_OPEN") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot unregister after contest has started"
    );
  }

  // Check if registered
  const userIndex = contest.registeredUsers.indexOf(req.user._id);
  if (userIndex === -1) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Not registered for this contest"
    );
  }

  // Unregister
  contest.registeredUsers.splice(userIndex, 1);
  await contest.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Successfully unregistered from contest",
  });
});

// @Route : GET /api/v1/contests/:id/submissions
// @DESC : Get user's submissions for a contest
export const getContestSubmissions = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);

  if (!contest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  const contestStatus = getContestStatus(contest);
  const isPublicViewAllowed =
    contestStatus === "ONGOING" || contestStatus === "ENDED";

  // If user is not authenticated and contest is not public, deny access
  if (!req.user && !isPublicViewAllowed) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Authentication required");
  }

  // Check if user is admin or creator
  let isCreatorOrAdmin = false;
  if (req.user) {
    const isCreator = contest.createdBy.toString() === req.user._id.toString();
    const isAdmin =
      req.user.role === "admin" ||
      req.user.role === "super-admin" ||
      req.user.email === process.env.ADMIN_EMAIL;
    isCreatorOrAdmin = isCreator || isAdmin;
  }

  // For creators/admins, show all submissions
  // For public viewing (ongoing/ended), show all submissions
  // For authenticated users during contest, show their own submissions
  const query =
    isCreatorOrAdmin || (!req.user && isPublicViewAllowed)
      ? { contestId: req.params.id }
      : { contestId: req.params.id, userId: req.user._id };

  const submissions = await Submission.find(query)
    .populate("problemId", "title difficulty")
    .populate("userId", "username")
    .select(
      "_id userId problemId finalVerdict executionTime memoryUsed languageId createdAt"
    )
    .sort({ createdAt: -1 })
    .lean();

  res.status(StatusCodes.OK).json({
    success: true,
    data: { submissions },
  });
});

// @Route : GET /api/v1/contests/:id/leaderboard
// @DESC : Get contest leaderboard
export const getContestLeaderboard = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);

  if (!contest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  const frozen = isLeaderboardFrozen(contest);
  const contestStatus = getContestStatus(contest);

  let leaderboard = await ContestLeaderboard.find({
    contestId: req.params.id,
  })
    .populate("userId", "username fullName avatarUrl")
    .sort({ rank: 1 })
    .lean();

  // If frozen and contest is ongoing, return snapshot from freeze start
  if (frozen && contestStatus === "ONGOING") {
    // For simplicity, we'll just indicate it's frozen
    // In production, you'd store a snapshot at freeze time
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      leaderboard,
      isFrozen: frozen,
      contestStatus,
    },
  });
});

// @Route : POST /api/v1/contests/:id/publish-results
// @DESC : Publish contest results (Admin only)
export const publishResults = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);

  if (!contest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  const contestStatus = getContestStatus(contest);

  if (contestStatus !== "ENDED") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Can only publish results after contest ends"
    );
  }

  // Recalculate final standings
  await recalculateRanks(contest._id);

  contest.resultsPublished = true;
  await contest.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Results published successfully",
  });
});

// @Route : GET /api/v1/contests/:id/clarifications
// @DESC : Get clarifications for a contest
export const getClarifications = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);

  if (!contest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  const isCreator = contest.createdBy.toString() === req.user._id.toString();
  const isAdmin =
    req.user.role === "admin" ||
    req.user.role === "super-admin" ||
    req.user.email === process.env.ADMIN_EMAIL;
  const isCreatorOrAdmin = isCreator || isAdmin;

  if (!contest.clarificationsEnabled && !isCreatorOrAdmin) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Clarifications are disabled for this contest"
    );
  }

  let query = { contestId: req.params.id };

  // Regular users see only their own clarifications
  // Admins and creators see all clarifications
  if (!isCreatorOrAdmin) {
    query.askedBy = req.user._id;
  }

  const clarifications = await Clarification.find(query)
    .populate("askedBy", "username fullName")
    .populate("answeredBy", "username fullName")
    .sort({ createdAt: -1 })
    .lean();

  res.status(StatusCodes.OK).json({
    success: true,
    data: { clarifications },
  });
});

// @Route : POST /api/v1/contests/:id/clarifications
// @DESC : Create a clarification (ask a question)
export const createClarification = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id);

  if (!contest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  if (!contest.clarificationsEnabled) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Clarifications are disabled for this contest"
    );
  }

  const contestStatus = getContestStatus(contest);

  if (contestStatus !== "ONGOING") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Can only ask clarifications during contest"
    );
  }

  const { question } = req.body;

  if (!question) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Question is required");
  }

  const clarification = await Clarification.create({
    contestId: req.params.id,
    question,
    askedBy: req.user._id,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Clarification submitted",
    clarification,
  });
});

// @Route : PUT /api/v1/contests/:id/clarifications/:clarId
// @DESC : Answer a clarification (Admin only)
export const answerClarification = asyncHandler(async (req, res) => {
  const { answer } = req.body;

  if (!answer) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Answer is required");
  }

  const clarification = await Clarification.findById(req.params.clarId);

  if (!clarification) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Clarification not found");
  }

  clarification.answer = answer;
  clarification.answeredBy = req.user._id;
  await clarification.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Clarification answered",
    clarification,
  });
});

// @Route : GET /api/v1/contests/:id/announcements
// @DESC : Get announcements for a contest
export const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({
    contestId: req.params.id,
  })
    .populate("createdBy", "username fullName")
    .sort({ createdAt: -1 })
    .lean();

  res.status(StatusCodes.OK).json({
    success: true,
    data: { announcements },
  });
});

// @Route : POST /api/v1/contests/:id/announcements
// @DESC : Create an announcement (Admin only)
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Message is required");
  }

  const contest = await Contest.findById(req.params.id);

  if (!contest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Contest not found");
  }

  const announcement = await Announcement.create({
    contestId: req.params.id,
    message,
    createdBy: req.user._id,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Announcement created",
    announcement,
  });
});

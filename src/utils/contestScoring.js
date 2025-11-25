import ContestLeaderboard from "../models/ContestLeaderboard.js";
import Contest from "../models/Contest.js";
import Submission from "../models/Submission.js";
import { VERDICTS } from "../constants.js";

/**
 * Calculate ICPC-style scoring
 * - Binary (solved/not solved)
 * - Penalty = time of first AC (in minutes from contest start) + 20 minutes per WA before AC
 * - Score = number of problems solved
 */
export const calculateICPCScore = (submissions, contestStartTime) => {
  const problemMap = new Map();

  // Group submissions by problem
  submissions.forEach((sub) => {
    const problemId = sub.problemId.toString();
    if (!problemMap.has(problemId)) {
      problemMap.set(problemId, []);
    }
    problemMap.get(problemId).push(sub);
  });

  let totalScore = 0;
  let totalPenalty = 0;
  const problemsSolved = [];

  // Calculate score for each problem
  problemMap.forEach((subs, problemId) => {
    // Sort by submission time
    subs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let solved = false;
    let attempts = 0;
    let wrongAttempts = 0;
    let solvedAt = null;

    for (const sub of subs) {
      attempts++;
      if (sub.finalVerdict === VERDICTS.AC) {
        solved = true;
        solvedAt = sub.createdAt;
        break;
      } else if (
        sub.finalVerdict === VERDICTS.WA ||
        sub.finalVerdict === VERDICTS.TLE ||
        sub.finalVerdict === VERDICTS.MLE ||
        sub.finalVerdict === VERDICTS.RE
      ) {
        wrongAttempts++;
      }
      // CE and SKIPPED don't count as wrong attempts
    }

    if (solved) {
      totalScore++;
      // Calculate penalty: time in minutes + 20 minutes per wrong attempt
      const timeFromStart =
        (new Date(solvedAt) - new Date(contestStartTime)) / (1000 * 60);
      const penalty = timeFromStart + wrongAttempts * 20;
      totalPenalty += penalty;

      problemsSolved.push({
        problemId,
        score: 1,
        attempts,
        solvedAt,
        penaltyTime: penalty,
      });
    }
  });

  return {
    score: totalScore,
    penalty: Math.round(totalPenalty),
    problemsSolved,
  };
};

/**
 * Calculate IOI-style scoring
 * - Partial scores per problem
 * - Take the best score for each problem
 * - No penalty time
 */
export const calculateIOIScore = (submissions, problemScores) => {
  const problemMap = new Map();

  // Group submissions by problem
  submissions.forEach((sub) => {
    const problemId = sub.problemId.toString();
    if (!problemMap.has(problemId)) {
      problemMap.set(problemId, []);
    }
    problemMap.get(problemId).push(sub);
  });

  let totalScore = 0;
  const problemsSolved = [];

  // Calculate best score for each problem
  problemMap.forEach((subs, problemId) => {
    let bestScore = 0;
    let bestSubmission = null;
    let attempts = subs.length;

    subs.forEach((sub) => {
      // Calculate score as percentage of test cases passed
      if (sub.testCaseResults && sub.testCaseResults.length > 0) {
        const passedTests = sub.testCaseResults.filter(
          (tc) => tc.verdict === VERDICTS.AC
        ).length;
        const scorePercent = (passedTests / sub.testCaseResults.length) * 100;

        if (scorePercent > bestScore) {
          bestScore = scorePercent;
          bestSubmission = sub;
        }
      } else if (sub.finalVerdict === VERDICTS.AC) {
        bestScore = 100;
        bestSubmission = sub;
      }
    });

    if (bestScore > 0) {
      totalScore += bestScore;
      problemsSolved.push({
        problemId,
        score: Math.round(bestScore),
        attempts,
        solvedAt: bestSubmission?.createdAt,
        penaltyTime: 0,
      });
    }
  });

  return {
    score: Math.round(totalScore),
    penalty: 0,
    problemsSolved,
  };
};

/**
 * Update contest leaderboard after a submission
 */
export const updateContestLeaderboard = async (submission) => {
  try {
    // Get contest details
    const contest = await Contest.findById(submission.contestId);
    if (!contest) {
      console.error("Contest not found for submission:", submission._id);
      return;
    }

    // Get all submissions for this user in this contest
    const userSubmissions = await Submission.find({
      contestId: submission.contestId,
      userId: submission.userId,
    })
      .populate("problemId", "_id")
      .sort({ createdAt: 1 });

    // Calculate score based on contest type
    let result;
    if (contest.scoringRules === "ICPC") {
      result = calculateICPCScore(userSubmissions, contest.startTime);
    } else if (contest.scoringRules === "IOI") {
      result = calculateIOIScore(userSubmissions, contest.problemScores || []);
    } else {
      // Default to ICPC
      result = calculateICPCScore(userSubmissions, contest.startTime);
    }

    // Update or create leaderboard entry
    await ContestLeaderboard.findOneAndUpdate(
      {
        contestId: submission.contestId,
        userId: submission.userId,
      },
      {
        score: result.score,
        penalty: result.penalty,
        problemsSolved: result.problemsSolved,
        lastSubmissionTime: submission.createdAt,
      },
      { upsert: true, new: true }
    );

    // Recalculate ranks for all participants
    await recalculateRanks(submission.contestId);
  } catch (error) {
    console.error("Error updating contest leaderboard:", error);
  }
};

/**
 * Recalculate ranks for all participants in a contest
 */
export const recalculateRanks = async (contestId) => {
  try {
    // Get all leaderboard entries sorted by score (desc) and penalty (asc)
    const entries = await ContestLeaderboard.find({ contestId })
      .sort({ score: -1, penalty: 1, lastSubmissionTime: 1 })
      .exec();

    // Update ranks
    let currentRank = 1;
    for (let i = 0; i < entries.length; i++) {
      // If score/penalty is same as previous, keep same rank
      if (
        i > 0 &&
        entries[i].score === entries[i - 1].score &&
        entries[i].penalty === entries[i - 1].penalty
      ) {
        entries[i].rank = entries[i - 1].rank;
      } else {
        entries[i].rank = currentRank;
      }
      currentRank++;

      await entries[i].save();
    }
  } catch (error) {
    console.error("Error recalculating ranks:", error);
  }
};

/**
 * Get contest status based on current time
 */
export const getContestStatus = (contest) => {
  const now = new Date();
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);
  const registrationStartTime = new Date(contest.registrationStartTime);
  const registrationEndTime = new Date(contest.registrationEndTime);

  if (now < registrationStartTime) {
    return "UPCOMING";
  } else if (now >= registrationStartTime && now < startTime) {
    return "REGISTRATION_OPEN";
  } else if (now >= startTime && now < endTime) {
    return "ONGOING";
  } else {
    return "ENDED";
  }
};

/**
 * Check if user can view contest problems
 */
export const canViewContestProblems = (contest, userId) => {
  const status = getContestStatus(contest);

  // Can view if contest is ongoing or ended
  if (status === "ONGOING" || status === "ENDED") {
    // Check if user is registered
    const isRegistered = contest.registeredUsers.some(
      (regUserId) => regUserId.toString() === userId.toString()
    );
    return isRegistered;
  }

  return false;
};

/**
 * Check if leaderboard is frozen
 */
export const isLeaderboardFrozen = (contest) => {
  if (!contest.freezeStartTime || !contest.freezeEndTime) {
    return false;
  }

  const now = new Date();
  const freezeStart = new Date(contest.freezeStartTime);
  const freezeEnd = new Date(contest.freezeEndTime);

  return now >= freezeStart && now <= freezeEnd;
};

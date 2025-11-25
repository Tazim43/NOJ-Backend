import dotenv from "dotenv";
dotenv.config();

export const DB_NAME = "naivedb";
export const LIMIT = "32mb";
export const BASEURL = "/api/v1";
export const TESTCASE_LIMIT = 45;

export const MAX_TIME_LIMIT = 20;
export const MIN_MEMORY_LIMIT = 2048;

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  SUPER_ADMIN: "super-admin",
};

export const axoisCEEHeaders = {
  "Content-Type": "application/json",
  "x-rapidapi-host": process.env.CEE_API_HOST,
  "x-rapidapi-key": process.env.CEE_API_KEY,
};

// Judge0 Language IDs - https://ce.judge0.com/#statuses-and-languages-language-get
export const Languages = {
  C: 50, // C (GCC 9.2.0)
  CPP: 54, // C++ (GCC 9.2.0)
  JAVA: 62, // Java (OpenJDK 13.0.1)
  PYTHON: 71, // Python (3.8.1)
};

export const supportedLanguages = [50, 54, 62, 71];

export const VERDICTS = {
  AC: "ACCEPTED",
  WA: "WRONG_ANSWER",
  TLE: "TIME_LIMIT_EXCEED",
  MLE: "MEMORY_LIMIT_EXCEED",
  RE: "RUNTIME_ERROR",
  CE: "COMPILATION_ERROR",
  SKIPPED: "SKIPPED",
  PENDING: "PENDING",
};

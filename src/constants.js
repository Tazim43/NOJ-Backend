export const DB_NAME = "naivedb";
export const LIMIT = "64kb";
export const BASEURL = "/api/v1";
export const TESTCASE_LIMIT = 45;

export const MAX_TIME_LIMIT = 20;
export const MIN_MEMORY_LIMIT = 2048;

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  SUPER_ADMIN: "super-admin",
};

export const Languages = {
  C: 103,
  CPP: 105,
  JAVA: 91,
  PYTHON: 100,
};

export const supportedLanguages = [103, 105, 91, 100];

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

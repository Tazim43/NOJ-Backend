import { z } from "zod";

// Problem validation schema
const problemValidationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  timeLimit: z.number().positive("Time limit must be a positive number"),
  memoryLimit: z.number().positive("Memory limit must be a positive number"),
  statementId: z.string().optional(), // Optional ObjectId
  authorIds: z
    .array(z.string().min(1, "Author ID is required"))
    .min(1, "At least one author is required")
    .optional(),
  testcaseIds: z.array(z.string()).optional(),
  solutionIds: z.array(z.string()).optional(),
  validatorIds: z.array(z.string()).optional(),
  contestId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  isVisible: z.boolean().optional(),
  isContestProblem: z.boolean().optional(),
});

export default problemValidationSchema;

import { z } from "zod";

// Base64 validation regex (checks valid Base64 format)
const base64Regex =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

// Problem statement validation schema
export const problemStatementValidation = z.object({
  description: z.string().optional(),
  constraints: z.string().optional(),
  inputDescription: z.string().optional(),
  outputDescription: z.string().optional(),
  imageList: z.array(z.string()).optional(),
  notes: z.string().optional(),
  samples: z.array(z.string()).optional(),
});

// Solution validation schema
export const solutionValidation = z.object({
  problemId: z.string().nonempty(),
  languageId: z.number().int(),
  source_code: z
    .string()
    .nonempty()
    .refine((val) => base64Regex.test(val), {
      message: "Source code must be a valid Base64-encoded string",
    }),
  authorId: z.string().nonempty(),
  isOptimal: z.boolean().optional(),
});

// Testcase validation schema
export const testcaseValidation = z.object({
  problemId: z.string().nonempty(),
  input: z
    .string()
    .nonempty()
    .refine((val) => base64Regex.test(val), {
      message: "Input must be a valid Base64-encoded string",
    }),
  expectedOutput: z
    .string()
    .optional()
    .refine((val) => !val || base64Regex.test(val), {
      message: "Expected output must be a valid Base64-encoded string",
    }),
  isSample: z.boolean().optional(),
  cpu_time: z.number().optional(),
  memory: z.number().optional(),
});

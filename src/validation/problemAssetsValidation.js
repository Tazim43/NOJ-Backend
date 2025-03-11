import { z } from "zod";

export const problemStatementValidation = z.object({
  description: z.string().nonempty(),
  constraints: z.string().optional(),
  inputDescription: z.string().nonempty(),
  outputDescription: z.string().nonempty(),
  imageList: z.array(z.string()).optional(),
  notes: z.string().optional(),
  samples: z.array(z.string()).optional(),
});

export const solutionValidation = z.object({
  problemId: z.string().nonempty(),
  languageId: z.number().int(),
  source_code: z.string().nonempty(),
  authorId: z.string().nonempty(),
  isOptimal: z.boolean().optional(),
});

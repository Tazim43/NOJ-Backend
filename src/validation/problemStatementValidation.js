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

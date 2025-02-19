import { z } from "zod";

const usernameRegex = /^[a-zA-Z0-9_]+$/; // Alphabets, numbers, and underscores
const fullNameRegex = /^[a-zA-Z\s.]+$/; // Alphabets, spaces, and periods

// User validation schema
const userValidationSchema = z.object({
  username: z
    .string()
    .min(1, { message: "Username is required" })
    .regex(usernameRegex, {
      message: "Username can only contain alphabets, numbers, and underscores",
    })
    .transform((val) => val.trim().toLowerCase()), // Trim and convert to lowercase

  email: z
    .string()
    .email({ message: "Invalid email address" })
    .transform((val) => val.trim().toLowerCase()), // Trim and convert to lowercase

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),

  fullName: z
    .string()
    .min(1, { message: "Full name is required" })
    .regex(fullNameRegex, {
      message: "Full name can only contain alphabets, spaces and periods",
    })
    .transform((val) => val.trim()), // Trim the full name
});

export default userValidationSchema;

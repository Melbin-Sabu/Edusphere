import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email or Admission Number is required"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(30, "Password cannot exceed 30 characters"),
});
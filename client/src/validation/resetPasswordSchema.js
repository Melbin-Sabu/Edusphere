import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email address is required")
      .email("Please enter a valid email address"),
    tempPassword: z
      .string()
      .min(1, "Temporary password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

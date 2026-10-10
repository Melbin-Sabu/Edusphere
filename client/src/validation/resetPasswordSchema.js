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
      .min(8, "New password must be at least 8 characters long")
      .max(30, "New password cannot exceed 30 characters")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
        "Must contain at least 1 letter, 1 number, and 1 special character"
      ),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

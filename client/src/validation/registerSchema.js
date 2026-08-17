import { z } from "zod";

export const registerSchema = z
  .object({
    // ==========================
    // Personal Information
    // ==========================
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must contain at least 2 characters")
      .max(60, "Full name cannot exceed 60 characters")
      .regex(/^[a-zA-Z\s'.]+$/, "Student name must contain only alphabets and spaces"),

    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Enter a valid email address"),

    mobile: z
      .string()
      .trim()
      .min(1, "Mobile number is required")
      .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9"),

    dob: z
      .string()
      .min(1, "Date of Birth is required")
      .refine(
        (val) => {
          if (!val) return false;
          const selectedDate = new Date(val);
          return !isNaN(selectedDate.getTime());
        },
        { message: "Please enter a valid Date of Birth" }
      )
      .refine(
        (val) => {
          const selectedDate = new Date(val);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return selectedDate < today;
        },
        { message: "Date of Birth cannot be today or a future date" }
      )
      .refine(
        (val) => {
          const selectedDate = new Date(val);
          const today = new Date();
          const min17Date = new Date(
            today.getFullYear() - 17,
            today.getMonth(),
            today.getDate()
          );
          return selectedDate <= min17Date;
        },
        { message: "Applicant must be at least 17 years old to register" }
      ),

    gender: z
      .string()
      .min(1, "Please select your gender"),

    address: z
      .string()
      .trim()
      .min(5, "Address must contain at least 5 characters"),

    // ==========================
    // Academic Information
    // ==========================
    course: z.enum(["NEET", "JEE"], {
      errorMap: () => ({ message: "Please select an assigned course (NEET or JEE)" }),
    }),

    batch: z
      .string()
      .min(1, "Please select your batch (Morning Batch or Evening Batch)"),

    tenthMark: z
      .string()
      .min(1, "10th Percentage / CGPA is required")
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 35 && Number(val) <= 100,
        { message: "10th percentage must be between 35% and 100%" }
      ),

    twelfthMark: z
      .string()
      .min(1, "12th Percentage / CGPA is required")
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 35 && Number(val) <= 100,
        { message: "12th percentage must be between 35% and 100%" }
      ),

    // ==========================
    // Parent Information
    // ==========================
    parentName: z
      .string()
      .trim()
      .min(2, "Parent name is required")
      .regex(/^[a-zA-Z\s'.]+$/, "Parent name must contain only alphabets and spaces"),

    relationship: z
      .string()
      .min(1, "Relationship is required"),

    parentEmail: z
      .string()
      .trim()
      .min(1, "Parent email is required")
      .email("Enter a valid parent email"),

    parentMobile: z
      .string()
      .trim()
      .min(1, "Parent mobile number is required")
      .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit parent mobile number"),

    // ==========================
    // Documents
    // ==========================
    tenthCertificate: z
      .any()
      .refine((files) => files && files.length === 1, "10th Certificate is required")
      .refine(
        (files) =>
          !files ||
          !files.length ||
          ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(files[0]?.type),
        "Only PDF, JPG and PNG files are allowed"
      )
      .refine(
        (files) => !files || !files.length || files[0]?.size <= 5 * 1024 * 1024,
        "File size must be less than 5MB"
      ),

    twelfthCertificate: z
      .any()
      .refine((files) => files && files.length === 1, "12th Certificate is required")
      .refine(
        (files) =>
          !files ||
          !files.length ||
          ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(files[0]?.type),
        "Only PDF, JPG and PNG files are allowed"
      )
      .refine(
        (files) => !files || !files.length || files[0]?.size <= 5 * 1024 * 1024,
        "File size must be less than 5MB"
      ),

    // ==========================
    // Account Information
    // ==========================
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
        "Password must contain uppercase, lowercase, number and special character"
      ),

    confirmPassword: z
      .string()
      .min(8, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.email.toLowerCase() !== data.parentEmail.toLowerCase(), {
    message: "Parent email cannot be identical to student email",
    path: ["parentEmail"],
  })
  .refine((data) => data.mobile !== data.parentMobile, {
    message: "Parent mobile cannot be identical to student mobile",
    path: ["parentMobile"],
  });
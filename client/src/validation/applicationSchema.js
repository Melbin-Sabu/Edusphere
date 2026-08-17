import { z } from "zod";

/**
 * Strict Validation Schema for Student Admission Application
 * Includes:
 * 1. Minimum age of 17 years for Date of Birth
 * 2. Mandatory Batch selection (Morning Batch / Evening Batch)
 * 3. Logical checks for emails, mobile numbers, marks, and document uploads
 */
export const applicationSchema = z
  .object({
    // ==========================
    // 1. Personal Details
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
      .email("Please enter a valid email address (e.g. student@gmail.com)"),

    mobile: z
      .string()
      .trim()
      .min(1, "Mobile number is required")
      .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9"),

    dateOfBirth: z
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
          // Cutoff date for exactly 17 years ago
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
      .min(5, "Permanent address must contain at least 5 characters")
      .max(300, "Address cannot exceed 300 characters"),

    // ==========================
    // 2. Academic Details
    // ==========================
    courseId: z
      .string()
      .min(1, "Please select a course (NEET or JEE)"),

    batchId: z
      .string()
      .min(1, "Please select your preferred batch (Morning Batch or Evening Batch)"),

    tenthPercentage: z
      .string()
      .min(1, "10th Percentage is required")
      .refine(
        (val) => {
          const num = Number(val);
          return !isNaN(num) && num >= 35 && num <= 100;
        },
        { message: "10th percentage must be a valid number between 35% and 100%" }
      ),

    twelfthPercentage: z
      .string()
      .min(1, "12th Percentage is required")
      .refine(
        (val) => {
          const num = Number(val);
          return !isNaN(num) && num >= 35 && num <= 100;
        },
        { message: "12th percentage must be a valid number between 35% and 100%" }
      ),

    // ==========================
    // 3. Parent & Guardian Details
    // ==========================
    parentName: z
      .string()
      .trim()
      .min(2, "Parent / Guardian name is required")
      .max(60, "Parent name cannot exceed 60 characters")
      .regex(/^[a-zA-Z\s'.]+$/, "Parent name must contain only alphabets and spaces"),

    relationship: z
      .string()
      .min(1, "Please select relationship with parent/guardian"),

    parentEmail: z
      .string()
      .trim()
      .min(1, "Parent email address is required")
      .email("Please enter a valid parent email address"),

    parentMobile: z
      .string()
      .trim()
      .min(1, "Parent mobile number is required")
      .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit parent mobile number starting with 6-9"),

    // ==========================
    // 4. Certificates & Documents
    // ==========================
    tenthCertificate: z
      .any()
      .refine((files) => files && files.length === 1, "10th Mark Sheet / Certificate is required")
      .refine(
        (files) =>
          !files ||
          !files.length ||
          ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(files[0]?.type),
        "Only PDF, JPG, or PNG files are allowed"
      )
      .refine(
        (files) => !files || !files.length || files[0]?.size <= 5 * 1024 * 1024,
        "File size must be less than 5MB"
      ),

    twelfthCertificate: z
      .any()
      .refine((files) => files && files.length === 1, "12th Mark Sheet / Certificate is required")
      .refine(
        (files) =>
          !files ||
          !files.length ||
          ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(files[0]?.type),
        "Only PDF, JPG, or PNG files are allowed"
      )
      .refine(
        (files) => !files || !files.length || files[0]?.size <= 5 * 1024 * 1024,
        "File size must be less than 5MB"
      ),
  })

  // Logical refinement 1: Student & Parent Email cannot be identical
  .refine((data) => data.email.toLowerCase() !== data.parentEmail.toLowerCase(), {
    message: "Parent email address cannot be identical to student email",
    path: ["parentEmail"],
  })

  // Logical refinement 2: Student & Parent Mobile Number cannot be identical
  .refine((data) => data.mobile !== data.parentMobile, {
    message: "Parent mobile number cannot be identical to student mobile number",
    path: ["parentMobile"],
  });

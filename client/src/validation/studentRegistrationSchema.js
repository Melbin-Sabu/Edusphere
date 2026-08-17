import { z } from "zod";
import { validateDeepEmail } from "../utils/deepEmailValidator";

const REPETITIVE_PHONE_REGEX = /^(0{10}|1{10}|2{10}|3{10}|4{10}|5{10}|6{10}|7{10}|8{10}|9{10}|1234567890)$/;
const REPETITIVE_NAME_REGEX = /^(.)\1{3,}$/;

export const studentRegistrationSchema = z
  .object({
    // Personal Details
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(60, "Full name cannot exceed 60 characters")
      .regex(/^[a-zA-Z\s'.]+$/, "Student name must contain only alphabets and spaces")
      .refine((val) => !REPETITIVE_NAME_REGEX.test(val.replace(/\s/g, "")), {
        message: "Please enter a valid student full name",
      }),

    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .superRefine((val, ctx) => {
        const result = validateDeepEmail(val);
        if (!result.isValid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: result.error || "Enter a valid email address",
          });
        }
      }),

    mobileNumber: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9")
      .refine((val) => !REPETITIVE_PHONE_REGEX.test(val), {
        message: "Please enter a genuine mobile number",
      }),

    dob: z
      .string()
      .min(1, "Date of Birth is required")
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
          const dobDate = new Date(val);
          const today = new Date();
          let age = today.getFullYear() - dobDate.getFullYear();
          const m = today.getMonth() - dobDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
            age--;
          }
          return age >= 14;
        },
        { message: "Student must be at least 14 years old to enroll" }
      )
      .refine(
        (val) => {
          const dobDate = new Date(val);
          const today = new Date();
          let age = today.getFullYear() - dobDate.getFullYear();
          const m = today.getMonth() - dobDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
            age--;
          }
          return age <= 40;
        },
        { message: "Student age cannot exceed 40 years" }
      ),

    gender: z.enum(["Male", "Female", "Other"], {
      errorMap: () => ({ message: "Please select a valid gender" }),
    }),

    address: z
      .string()
      .trim()
      .min(10, "Address must contain at least 10 characters for complete location details")
      .max(250, "Address cannot exceed 250 characters"),

    // Academic Details
    course: z.enum(["NEET", "JEE"], {
      errorMap: () => ({ message: "Please select an assigned course (NEET or JEE)" }),
    }),

    batch: z.string().optional(),

    tenthPercentage: z
      .string()
      .min(1, "10th Percentage is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 35 && Number(val) <= 100, {
        message: "10th percentage must be between 35.00% and 100.00%",
      }),

    twelfthPercentage: z
      .string()
      .min(1, "12th Percentage is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 35 && Number(val) <= 100, {
        message: "12th percentage must be between 35.00% and 100.00%",
      }),

    // Parent Details
    parentName: z
      .string()
      .trim()
      .min(2, "Parent/Guardian name must be at least 2 characters")
      .max(60, "Parent name cannot exceed 60 characters")
      .regex(/^[a-zA-Z\s'.]+$/, "Parent name must contain only alphabets and spaces"),

    parentEmail: z
      .string()
      .trim()
      .min(1, "Parent email address is required")
      .superRefine((val, ctx) => {
        const result = validateDeepEmail(val);
        if (!result.isValid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: result.error || "Enter a valid parent email address",
          });
        }
      }),

    parentMobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9")
      .refine((val) => !REPETITIVE_PHONE_REGEX.test(val), {
        message: "Please enter a genuine parent mobile number",
      }),

    relationship: z.enum(["Father", "Mother", "Guardian"], {
      errorMap: () => ({ message: "Please select a valid relationship" }),
    }),

    // Documents
    tenthCertificate: z
      .any()
      .optional()
      .refine(
        (files) => {
          if (!files || files.length === 0) return true;
          const file = files[0];
          return file.size <= 5 * 1024 * 1024;
        },
        { message: "10th Certificate file size must not exceed 5MB" }
      )
      .refine(
        (files) => {
          if (!files || files.length === 0) return true;
          const file = files[0];
          return ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(file.type);
        },
        { message: "Allowed file formats: PDF, JPG, PNG" }
      ),

    twelfthCertificate: z
      .any()
      .optional()
      .refine(
        (files) => {
          if (!files || files.length === 0) return true;
          const file = files[0];
          return file.size <= 5 * 1024 * 1024;
        },
        { message: "12th Certificate file size must not exceed 5MB" }
      )
      .refine(
        (files) => {
          if (!files || files.length === 0) return true;
          const file = files[0];
          return ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(file.type);
        },
        { message: "Allowed file formats: PDF, JPG, PNG" }
      ),
  })
  // Cross-Field Logic Refinements
  .refine(
    (data) => data.email.toLowerCase().trim() !== data.parentEmail.toLowerCase().trim(),
    {
      message: "Parent email address cannot be identical to student email address",
      path: ["parentEmail"],
    }
  )
  .refine(
    (data) => data.mobileNumber.trim() !== data.parentMobile.trim(),
    {
      message: "Parent mobile number cannot be identical to student mobile number",
      path: ["parentMobile"],
    }
  )
  .refine(
    (data) => data.fullName.toLowerCase().trim() !== data.parentName.toLowerCase().trim(),
    {
      message: "Parent name cannot be identical to student full name",
      path: ["parentName"],
    }
  );


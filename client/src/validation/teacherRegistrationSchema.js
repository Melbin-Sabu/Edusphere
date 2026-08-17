import { z } from "zod";
import { validateDeepEmail } from "../utils/deepEmailValidator";

const REPETITIVE_PHONE_REGEX = /^(0{10}|1{10}|2{10}|3{10}|4{10}|5{10}|6{10}|7{10}|8{10}|9{10}|1234567890)$/;
const REPETITIVE_NAME_REGEX = /^(.)\1{3,}$/;

export const teacherRegistrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Faculty full name must be at least 2 characters")
    .max(60, "Faculty full name cannot exceed 60 characters")
    .regex(/^[a-zA-Z\s'.]+$/, "Faculty name must contain only alphabets, spaces, dots or apostrophes")
    .refine((val) => !REPETITIVE_NAME_REGEX.test(val.replace(/\s/g, "")), {
      message: "Please enter a valid faculty full name",
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

  department: z.enum(["JEE", "NEET"], {
    errorMap: () => ({ message: "Please select department (JEE or NEET)" }),
  }),

  subject: z
    .string()
    .trim()
    .min(1, "Please select a teaching subject"),

  designation: z
    .string()
    .trim()
    .min(1, "Please select or enter a designation"),

  qualification: z
    .string()
    .trim()
    .min(2, "Qualification details must be at least 2 characters"),

  experience: z
    .string()
    .trim()
    .min(1, "Experience is required (e.g. 5 Years)"),

  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Please select gender" }),
  }),

  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters long"),

  assignedBatches: z.array(z.string()).optional(),
});

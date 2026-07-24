import { z } from "zod";

/** Coerce blank / missing optional numbers to null for update payloads. */
function optionalNullableInt(opts: {
  min: number;
  max: number;
  label: string;
  whole?: boolean;
}) {
  return z.preprocess((raw) => {
    if (raw === undefined) return undefined;
    if (raw === null || raw === "") return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    return raw;
  }, z.union([
    z.null(),
    z.coerce
      .number({ invalid_type_error: `${opts.label} must be a number` })
      .refine((n) => !Number.isNaN(n), { message: `${opts.label} must be a number` })
      .refine((n) => (opts.whole ? Number.isInteger(n) : true), {
        message: `${opts.label} must be a whole number`,
      })
      .refine((n) => n >= opts.min && n <= opts.max, {
        message: `${opts.label} must be between ${opts.min} and ${opts.max}`,
      }),
  ]).optional());
}

function optionalNullableFloat(opts: { min: number; max: number; label: string }) {
  return z.preprocess((raw) => {
    if (raw === undefined) return undefined;
    if (raw === null || raw === "") return null;
    if (typeof raw === "string" && raw.trim() === "") return null;
    return raw;
  }, z.union([
    z.null(),
    z.coerce
      .number({ invalid_type_error: `${opts.label} must be a number` })
      .refine((n) => !Number.isNaN(n), { message: `${opts.label} must be a number` })
      .refine((n) => n >= opts.min && n <= opts.max, {
        message: `${opts.label} must be between ${opts.min} and ${opts.max}`,
      }),
  ]).optional());
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_MIN = 1900;
const YEAR_MAX = CURRENT_YEAR + 20;

const academicYear = (label: string) =>
  optionalNullableInt({
    min: YEAR_MIN,
    max: YEAR_MAX,
    label,
    whole: true,
  });

const cgpa = optionalNullableFloat({ min: 0, max: 10, label: "CGPA" });

const academicFields = {
  academic_start_year: academicYear("Academic start year"),
  academic_end_year: academicYear("Academic end year"),
  /** Legacy alias for academic_end_year. */
  passing_year: academicYear("Academic end year"),
  branch: z.string().trim().max(150).optional().nullable(),
  specialization: z.string().trim().max(150).optional().nullable(),
};

function withAcademicSpanCheck<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).superRefine((data, ctx) => {
    const start = data.academic_start_year as number | null | undefined;
    const end =
      (data.academic_end_year as number | null | undefined) ??
      (data.passing_year as number | null | undefined);
    if (typeof start === "number" && typeof end === "number" && start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["academic_start_year"],
        message: "Academic start year must be on or before end year",
      });
    }
  }).transform((data) => {
    const endRaw =
      data.academic_end_year !== undefined ? data.academic_end_year : data.passing_year;
    const branchRaw = data.branch !== undefined ? data.branch : data.specialization;
    const next = { ...data };

    if (data.academic_end_year !== undefined || data.passing_year !== undefined) {
      next.academic_end_year = endRaw ?? null;
      next.passing_year = endRaw ?? null;
    }
    if (data.branch !== undefined || data.specialization !== undefined) {
      next.branch = branchRaw ?? null;
      next.specialization = branchRaw ?? null;
    }
    return next;
  });
}

export const createStudentSchema = withAcademicSpanCheck({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  college_id: z.string().uuid("Select a valid college"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  student_identifier: z.string().trim().max(100).optional().nullable(),
  phone_number: z.string().trim().max(30).optional().nullable(),
  degree: z.string().trim().max(150).optional().nullable(),
  ...academicFields,
  cgpa,
});

export const updateStudentSchema = withAcademicSpanCheck({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long").optional(),
  email: z.string().trim().email("Enter a valid email").max(255).optional(),
  college_id: z.string().uuid("Select a valid college").optional().nullable(),
  status: z.string().trim().max(50).optional(),
  is_active: z.boolean().optional(),
  student_identifier: z.string().trim().max(100).optional().nullable(),
  phone_number: z.string().trim().max(30).optional().nullable(),
  degree: z.string().trim().max(150).optional().nullable(),
  ...academicFields,
  cgpa,
});

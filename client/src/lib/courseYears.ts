/** Typical program lengths used to infer start year when only end year is stored. */
const DEGREE_DURATION_YEARS: Array<{ match: RegExp; years: number }> = [
  { match: /\b(b\.?\s*e\.?|b\.?\s*tech|be\b|btech)/i, years: 4 },
  { match: /\b(b\.?\s*sc|bsc|b\.?\s*com|bcom|b\.?\s*a\.?\b|\bba\b)/i, years: 3 },
  { match: /\b(m\.?\s*tech|m\.?\s*e\.?|mca|mba|m\.?\s*sc|msc|m\.?\s*com|mcom)/i, years: 2 },
  { match: /\b(diploma)/i, years: 3 },
  { match: /\b(ph\.?\s*d|doctorate)/i, years: 5 },
  { match: /\bbachelor/i, years: 4 },
];

/** Default UG engineering length when degree is missing or unrecognized. */
const DEFAULT_DURATION_YEARS = 4;

export function getDegreeDurationYears(degree?: string | null): number {
  const d = (degree || "").trim();
  if (!d) return DEFAULT_DURATION_YEARS;
  for (const { match, years } of DEGREE_DURATION_YEARS) {
    if (match.test(d)) return years;
  }
  return DEFAULT_DURATION_YEARS;
}

export function getCourseStartYear(
  degree?: string | null,
  endYear?: number | null
): number | null {
  if (endYear == null || !Number.isFinite(Number(endYear))) return null;
  return Number(endYear) - getDegreeDurationYears(degree);
}

/**
 * Format academic start–end years, e.g. "2002 - 2006".
 * Uses stored start year when present; otherwise infers from degree + end year.
 */
export function formatAcademicYears(
  startYear?: number | null,
  endYear?: number | null,
  degree?: string | null,
  fallback = "—"
): string {
  const end = endYear != null && Number.isFinite(Number(endYear)) ? Number(endYear) : null;
  const start =
    startYear != null && Number.isFinite(Number(startYear))
      ? Number(startYear)
      : end != null
        ? getCourseStartYear(degree, end)
        : null;
  if (start != null && end != null) return `${start} - ${end}`;
  if (end != null) return String(end);
  if (start != null) return String(start);
  return fallback;
}

/**
 * Format stored passing/end year as a full course span, e.g. "2002 - 2006".
 * Prefer formatAcademicYears when start year is available.
 */
export function formatCourseYears(
  degree?: string | null,
  passingYear?: number | null,
  fallback = "—",
  startYear?: number | null
): string {
  return formatAcademicYears(
    startYear ?? null,
    passingYear,
    degree,
    typeof fallback === "string" ? fallback : "—"
  );
}

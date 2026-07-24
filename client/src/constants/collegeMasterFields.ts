/** Shared options for Add College / college master record UI */

export const INSTITUTION_TYPES = [
  "University",
  "Autonomous College",
  "Affiliated College",
  "Deemed University",
  "Others",
] as const;

export const OWNERSHIP_TYPES = [
  "Government",
  "Private",
  "Deemed",
  "Trust",
  "Society",
] as const;

export const CATEGORY_OPTIONS = [
  "Engineering",
  "Medical",
  "Arts & Science",
  "Management",
  "Law",
  "Pharmacy",
  "Polytechnic",
  "Other",
] as const;

export const NAAC_GRADES = ["A++", "A+", "A", "B++", "B+", "B", "C", "D"] as const;

export type InstitutionType = (typeof INSTITUTION_TYPES)[number];
export type OwnershipType = (typeof OWNERSHIP_TYPES)[number];
export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

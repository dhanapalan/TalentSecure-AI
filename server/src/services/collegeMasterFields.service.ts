/**
 * College master-record fields for superadmin Add/Update College.
 * Keeps DB ensure + enums + validation in one place.
 * Validation throws plain Error (message only) so unit tests stay dependency-free;
 * controllers wrap with AppError.
 */

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Require country code: + followed by 10–15 digits */
const PHONE_RE = /^\+\d{10,15}$/;
const PIN_RE = /^\d{6}$/;

let ensured = false;

export async function ensureCollegeMasterColumns(): Promise<void> {
  if (ensured) return;
  const { pool } = await import("../config/database.js");
  await pool.query(`
    ALTER TABLE colleges
      ADD COLUMN IF NOT EXISTS establishment_year INT,
      ADD COLUMN IF NOT EXISTS institution_type VARCHAR(80),
      ADD COLUMN IF NOT EXISTS ownership VARCHAR(50),
      ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS district VARCHAR(100),
      ADD COLUMN IF NOT EXISTS admission_email VARCHAR(150),
      ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
      ADD COLUMN IF NOT EXISTS principal_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS naac_grade VARCHAR(10),
      ADD COLUMN IF NOT EXISTS total_students INT,
      ADD COLUMN IF NOT EXISTS short_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS university VARCHAR(255),
      ADD COLUMN IF NOT EXISTS website VARCHAR(255),
      ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
      ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
      ADD COLUMN IF NOT EXISTS country VARCHAR(120) DEFAULT 'India',
      ADD COLUMN IF NOT EXISTS pin_code VARCHAR(20)
  `);
  ensured = true;
}

export interface CollegeMasterInput {
  name: string;
  shortName?: string | null;
  establishmentYear: number;
  institutionType: string;
  ownership: string;
  categories: string[];
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  district: string;
  state: string;
  country?: string;
  pincode: string;
  website: string;
  email: string;
  admissionEmail?: string | null;
  phone: string;
  alternatePhone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  principalName?: string | null;
  affiliatedUniversity?: string | null;
  naacGrade?: string | null;
  totalStudents?: number | null;
  tpoName: string;
  tpoEmail: string;
}

function trimStr(v: unknown, max?: number): string {
  let s = String(v ?? "").trim();
  if (max && s.length > max) s = s.slice(0, max);
  return s;
}

function emptyToNull(v: unknown, max?: number): string | null {
  const s = trimStr(v, max);
  return s === "" ? null : s;
}

function normalizePhone(v: unknown): string {
  return String(v ?? "").replace(/[\s\-()]/g, "").trim();
}

function normalizeWebsite(v: unknown): string {
  let s = trimStr(v, 255);
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  return s;
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function parseOptionalNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Parse + validate create/update body. Throws Error on validation failure.
 * Set `requireTpo: false` for profile updates that do not rotate TPO credentials.
 */
export function parseAndValidateCollegeMaster(
  body: Record<string, unknown>,
  opts: { requireTpo?: boolean } = {}
): CollegeMasterInput {
  const requireTpo = opts.requireTpo !== false;
  const name = trimStr(body.name ?? body.full_name, 255);
  const shortName = emptyToNull(body.shortName ?? body.short_name, 50);
  const establishmentYear = Number(body.establishmentYear ?? body.establishment_year);
  const institutionType = trimStr(body.institutionType ?? body.institution_type, 80);
  const ownership = trimStr(body.ownership, 50);

  let categoriesRaw = body.categories ?? body.category;
  let categories: string[] = [];
  if (Array.isArray(categoriesRaw)) {
    categories = categoriesRaw.map((c) => String(c).trim()).filter(Boolean);
  } else if (typeof categoriesRaw === "string" && categoriesRaw.trim()) {
    categories = categoriesRaw.split(",").map((c) => c.trim()).filter(Boolean);
  }

  const addressLine1 = trimStr(body.addressLine1 ?? body.address_line1 ?? body.address, 255);
  const addressLine2 = emptyToNull(body.addressLine2 ?? body.address_line2, 255);
  const city = trimStr(body.city, 100);
  const district = trimStr(body.district, 100);
  const state = trimStr(body.state, 100);
  const country = trimStr(body.country, 100) || "India";
  const pincode = trimStr(body.pincode ?? body.pin_code ?? body.pinCode, 10);
  const website = normalizeWebsite(body.website);
  const email = trimStr(body.email ?? body.general_email ?? body.generalEmail, 150).toLowerCase();
  const admissionEmail = emptyToNull(
    body.admissionEmail ?? body.admission_email,
    150
  )?.toLowerCase() ?? null;
  const phone = normalizePhone(body.phone ?? body.phone_number ?? body.phoneNumber);
  const alternatePhone = normalizePhone(body.alternatePhone ?? body.alternate_phone);
  const latitude = parseOptionalNumber(body.latitude);
  const longitude = parseOptionalNumber(body.longitude);
  const principalName = emptyToNull(body.principalName ?? body.principal_name, 150);
  const affiliatedUniversity = emptyToNull(
    body.affiliatedUniversity ?? body.affiliated_university ?? body.university,
    200
  );
  const naacGrade = emptyToNull(body.naacGrade ?? body.naac_grade, 10);
  const totalStudents = parseOptionalNumber(body.totalStudents ?? body.total_students);
  const tpoName = trimStr(body.tpoName ?? body.tpo_name, 150);
  const tpoEmail = trimStr(body.tpoEmail ?? body.tpo_email, 150).toLowerCase();

  const currentYear = new Date().getFullYear();

  if (!name) throw new Error("Official college name is required");
  if (name.length < 3) throw new Error("College name must be at least 3 characters");
  if (shortName && shortName.length > 50) {
    throw new Error("Short name cannot exceed 50 characters");
  }

  if (!Number.isInteger(establishmentYear) || Number.isNaN(establishmentYear)) {
    throw new Error("Establishment year is required");
  }
  if (establishmentYear < 1800 || establishmentYear > currentYear) {
    throw new Error(`Establishment year must be between 1800 and ${currentYear}`);
  }

  if (!institutionType) throw new Error("Institution type is required");
  if (!(INSTITUTION_TYPES as readonly string[]).includes(institutionType)) {
    throw new Error("Invalid institution type");
  }

  if (!ownership) throw new Error("Ownership is required");
  if (!(OWNERSHIP_TYPES as readonly string[]).includes(ownership)) {
    throw new Error("Invalid ownership");
  }

  if (categories.length === 0) throw new Error("Select at least one category");
  for (const c of categories) {
    if (!(CATEGORY_OPTIONS as readonly string[]).includes(c)) {
      throw new Error(`Invalid category: ${c}`);
    }
  }

  if (!addressLine1) throw new Error("Address line 1 is required");
  if (!city) throw new Error("City is required");
  if (!district) throw new Error("District is required");
  if (!state) throw new Error("State is required");
  if (!country) throw new Error("Country is required");

  if (!pincode) throw new Error("Pincode is required");
  if (country.toLowerCase() === "india" && !PIN_RE.test(pincode)) {
    throw new Error("Pincode must be exactly 6 digits");
  }

  if (!website) throw new Error("Website is required");
  if (!isValidUrl(website)) throw new Error("Enter a valid website URL");

  if (!email) throw new Error("General email is required");
  if (!EMAIL_RE.test(email)) throw new Error("Enter a valid general email address");
  if (admissionEmail && !EMAIL_RE.test(admissionEmail)) {
    throw new Error("Enter a valid admission email address");
  }

  if (!phone) throw new Error("Phone number is required");
  if (!PHONE_RE.test(phone)) {
    throw new Error("Phone must include country code (e.g. +919876543210)");
  }
  if (alternatePhone && !PHONE_RE.test(alternatePhone)) {
    throw new Error("Alternate phone must include country code (e.g. +919876543210)");
  }

  if (latitude !== null && (Number.isNaN(latitude) || latitude < -90 || latitude > 90)) {
    throw new Error("Latitude must be between -90 and 90");
  }
  if (longitude !== null && (Number.isNaN(longitude) || longitude < -180 || longitude > 180)) {
    throw new Error("Longitude must be between -180 and 180");
  }

  if (institutionType === "Affiliated College" && !affiliatedUniversity) {
    throw new Error("Affiliated university is required for Affiliated College");
  }

  if (naacGrade && !(NAAC_GRADES as readonly string[]).includes(naacGrade)) {
    throw new Error("Invalid NAAC grade");
  }

  if (totalStudents !== null) {
    if (Number.isNaN(totalStudents) || !Number.isInteger(totalStudents) || totalStudents < 0) {
      throw new Error("Total students must be a non-negative whole number");
    }
  }

  if (requireTpo) {
    if (!tpoName) throw new Error("TPO name is required");
    if (!tpoEmail) throw new Error("TPO email is required");
    if (!EMAIL_RE.test(tpoEmail)) throw new Error("Enter a valid TPO email address");
    if (tpoEmail === email) {
      throw new Error("TPO login email must be different from the college email");
    }
  }

  return {
    name,
    shortName,
    establishmentYear,
    institutionType,
    ownership,
    categories,
    addressLine1,
    addressLine2,
    city,
    district,
    state,
    country,
    pincode,
    website,
    email,
    admissionEmail,
    phone,
    alternatePhone: alternatePhone || null,
    latitude,
    longitude,
    principalName,
    affiliatedUniversity,
    naacGrade,
    totalStudents,
    tpoName,
    tpoEmail,
  };
}

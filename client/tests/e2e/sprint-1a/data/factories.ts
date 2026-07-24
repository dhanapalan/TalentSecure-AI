export type CollegePayload = {
  name: string;
  shortName?: string;
  establishmentYear: number;
  institutionType: string;
  ownership: string;
  categories: string[];
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  state: string;
  country?: string;
  pincode: string;
  website: string;
  email: string;
  admissionEmail?: string;
  phone: string;
  alternatePhone?: string;
  affiliatedUniversity?: string;
  tpoName: string;
  tpoEmail: string;
};

export type StudentPayload = {
  roll_number: string;
  name: string;
  email: string;
  mobile?: string;
  department: string;
  batch: string;
  gender?: string;
};

function stamp(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function buildCollege(overrides: Partial<CollegePayload> = {}): CollegePayload {
  const id = stamp();
  return {
    name: `QA College ${id}`,
    shortName: `QA${id.slice(-4)}`,
    establishmentYear: 2001,
    institutionType: "Autonomous College",
    ownership: "Private",
    categories: ["Engineering"],
    addressLine1: "100 QA Automation Street",
    city: "Bangalore",
    district: "Bangalore Urban",
    state: "Karnataka",
    country: "India",
    pincode: "560001",
    website: `https://qa-college-${id}.edu`,
    email: `qa.college.${id}@example.edu`,
    phone: `+9198${String(id).slice(-8).padStart(8, "0")}`,
    tpoName: `TPO ${id}`,
    tpoEmail: `tpo.${id}@example.edu`,
    ...overrides,
  };
}

export function buildStudent(overrides: Partial<StudentPayload> = {}): StudentPayload {
  const id = stamp();
  return {
    roll_number: `QA${id.slice(-8)}`,
    name: `QA Student ${id.slice(-6)}`,
    email: `qa.student.${id}@example.edu`,
    mobile: `98${String(id).slice(-8).padStart(8, "0")}`,
    department: "CSE",
    batch: "2026",
    gender: "male",
    ...overrides,
  };
}

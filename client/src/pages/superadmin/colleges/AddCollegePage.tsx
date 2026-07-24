import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, Copy } from "lucide-react";
import collegeService, { CreateCollegeResult } from "../../../services/collegeService";
import {
  CATEGORY_OPTIONS,
  INSTITUTION_TYPES,
  NAAC_GRADES,
  OWNERSHIP_TYPES,
} from "../../../constants/collegeMasterFields";

interface CollegeFormData {
  name: string;
  shortName: string;
  establishmentYear: string;
  institutionType: string;
  ownership: string;
  categories: string[];
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  website: string;
  email: string;
  admissionEmail: string;
  phone: string;
  alternatePhone: string;
  latitude: string;
  longitude: string;
  principalName: string;
  affiliatedUniversity: string;
  naacGrade: string;
  totalStudents: string;
  tpoName: string;
  tpoEmail: string;
}

type FieldName = keyof CollegeFormData;
type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+\d{10,15}$/;
const PIN_RE = /^\d{6}$/;
const CURRENT_YEAR = new Date().getFullYear();

const EMPTY_FORM: CollegeFormData = {
  name: "",
  shortName: "",
  establishmentYear: "",
  institutionType: "",
  ownership: "",
  categories: [],
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  pincode: "",
  website: "",
  email: "",
  admissionEmail: "",
  phone: "",
  alternatePhone: "",
  latitude: "",
  longitude: "",
  principalName: "",
  affiliatedUniversity: "",
  naacGrade: "",
  totalStudents: "",
  tpoName: "",
  tpoEmail: "",
};

function inputClass(hasError: boolean): string {
  return [
    "w-full px-4 py-2 rounded-lg transition",
    "focus:ring-2 focus:ring-admin-accent focus:border-transparent",
    hasError
      ? "border border-rose-400 bg-rose-50/40 focus:ring-rose-300"
      : "border border-gray-300",
  ].join(" ");
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-rose-600" role="alert">
      {message}
    </p>
  );
}

function normalizePhone(v: string): string {
  return v.replace(/[\s\-()]/g, "").trim();
}

function normalizeWebsite(v: string): string {
  const s = v.trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) return `https://${s}`;
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

function validateFields(formData: CollegeFormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!formData.name.trim()) {
    errors.name = "Official college name is required";
  } else if (formData.name.trim().length < 3) {
    errors.name = "College name must be at least 3 characters";
  } else if (formData.name.trim().length > 255) {
    errors.name = "College name cannot exceed 255 characters";
  }

  if (formData.shortName.trim().length > 50) {
    errors.shortName = "Short name cannot exceed 50 characters";
  }

  const year = Number(formData.establishmentYear);
  if (!formData.establishmentYear.trim()) {
    errors.establishmentYear = "Establishment year is required";
  } else if (!Number.isInteger(year) || year < 1800 || year > CURRENT_YEAR) {
    errors.establishmentYear = `Enter a year between 1800 and ${CURRENT_YEAR}`;
  }

  if (!formData.institutionType) {
    errors.institutionType = "Institution type is required";
  }

  if (!formData.ownership) {
    errors.ownership = "Ownership is required";
  }

  if (formData.categories.length === 0) {
    errors.categories = "Select at least one category";
  }

  if (!formData.addressLine1.trim()) {
    errors.addressLine1 = "Address line 1 is required";
  } else if (formData.addressLine1.trim().length > 255) {
    errors.addressLine1 = "Address line 1 cannot exceed 255 characters";
  }

  if (formData.addressLine2.trim().length > 255) {
    errors.addressLine2 = "Address line 2 cannot exceed 255 characters";
  }

  if (!formData.city.trim()) errors.city = "City is required";
  if (!formData.district.trim()) errors.district = "District is required";
  if (!formData.state.trim()) errors.state = "State is required";
  if (!formData.country.trim()) errors.country = "Country is required";

  if (!formData.pincode.trim()) {
    errors.pincode = "Pincode is required";
  } else if (
    formData.country.trim().toLowerCase() === "india" &&
    !PIN_RE.test(formData.pincode.trim())
  ) {
    errors.pincode = "Pincode must be exactly 6 digits";
  }

  const website = normalizeWebsite(formData.website);
  if (!formData.website.trim()) {
    errors.website = "Website is required";
  } else if (!isValidUrl(website)) {
    errors.website = "Enter a valid website URL";
  }

  if (!formData.email.trim()) {
    errors.email = "General email is required";
  } else if (!EMAIL_RE.test(formData.email.trim())) {
    errors.email = "Enter a valid general email address";
  } else if (formData.email.trim().length > 150) {
    errors.email = "Email cannot exceed 150 characters";
  }

  if (formData.admissionEmail.trim()) {
    if (!EMAIL_RE.test(formData.admissionEmail.trim())) {
      errors.admissionEmail = "Enter a valid admission email address";
    } else if (formData.admissionEmail.trim().length > 150) {
      errors.admissionEmail = "Email cannot exceed 150 characters";
    }
  }

  const phone = normalizePhone(formData.phone);
  if (!formData.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!PHONE_RE.test(phone)) {
    errors.phone = "Include country code (e.g. +919876543210)";
  }

  const altPhone = normalizePhone(formData.alternatePhone);
  if (formData.alternatePhone.trim() && !PHONE_RE.test(altPhone)) {
    errors.alternatePhone = "Include country code (e.g. +919876543210)";
  }

  if (formData.latitude.trim()) {
    const lat = Number(formData.latitude);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = "Latitude must be between -90 and 90";
    }
  }

  if (formData.longitude.trim()) {
    const lng = Number(formData.longitude);
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = "Longitude must be between -180 and 180";
    }
  }

  if (formData.institutionType === "Affiliated College" && !formData.affiliatedUniversity.trim()) {
    errors.affiliatedUniversity = "Affiliated university is required for Affiliated College";
  }

  if (formData.totalStudents.trim()) {
    const n = Number(formData.totalStudents);
    if (!Number.isInteger(n) || n < 0) {
      errors.totalStudents = "Total students must be a non-negative whole number";
    }
  }

  if (!formData.tpoName.trim()) {
    errors.tpoName = "TPO name is required";
  }

  if (!formData.tpoEmail.trim()) {
    errors.tpoEmail = "TPO email is required";
  } else if (!EMAIL_RE.test(formData.tpoEmail.trim())) {
    errors.tpoEmail = "Enter a valid TPO email address";
  } else if (
    formData.email.trim() &&
    formData.tpoEmail.trim().toLowerCase() === formData.email.trim().toLowerCase()
  ) {
    errors.tpoEmail = "TPO login email must be different from the general email";
  }

  return errors;
}

function mapApiErrorToFields(apiMsg: string): FieldErrors {
  const lower = apiMsg.toLowerCase();
  if (lower.includes("official name") || lower.includes("college with this official")) {
    return { name: apiMsg };
  }
  if (lower.includes("college with this email") || lower.includes("general email")) {
    return { email: apiMsg };
  }
  if (lower.includes("tpo email") || lower.includes("user with this tpo")) {
    return { tpoEmail: apiMsg };
  }
  if (lower.includes("admission email")) return { admissionEmail: apiMsg };
  if (lower.includes("alternate phone")) return { alternatePhone: apiMsg };
  if (lower.includes("phone")) return { phone: apiMsg };
  if (lower.includes("website")) return { website: apiMsg };
  if (lower.includes("pincode") || lower.includes("pin code")) return { pincode: apiMsg };
  if (lower.includes("establishment")) return { establishmentYear: apiMsg };
  if (lower.includes("institution type")) return { institutionType: apiMsg };
  if (lower.includes("ownership")) return { ownership: apiMsg };
  if (lower.includes("category")) return { categories: apiMsg };
  if (lower.includes("affiliated")) return { affiliatedUniversity: apiMsg };
  if (lower.includes("district")) return { district: apiMsg };
  if (lower.includes("address")) return { addressLine1: apiMsg };
  return {};
}

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required ? <span className="text-rose-600"> *</span> : null}
    </label>
  );
}

export default function AddCollegePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreateCollegeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<CollegeFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const clearFieldError = (name: FieldName) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormError(null);
  };

  const setField = (name: FieldName, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setField(name as FieldName, value);
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const field = e.target.name as FieldName;
    setTouched((prev) => ({ ...prev, [field]: true }));
    const next = validateFields(formData);
    setErrors((prev) => {
      const merged = { ...prev };
      if (next[field]) merged[field] = next[field];
      else delete merged[field];
      return merged;
    });
  };

  const toggleCategory = (category: string) => {
    setFormData((prev) => {
      const has = prev.categories.includes(category);
      const categories = has
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
    setTouched((prev) => ({ ...prev, categories: true }));
    clearFieldError("categories");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nextErrors = validateFields(formData);
    setErrors(nextErrors);
    const allTouched = Object.keys(EMPTY_FORM).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Partial<Record<FieldName, boolean>>
    );
    setTouched(allTouched);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`college-field-${first}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const result = await collegeService.createCollege({
        name: formData.name.trim(),
        shortName: formData.shortName.trim() || null,
        establishmentYear: Number(formData.establishmentYear),
        institutionType: formData.institutionType,
        ownership: formData.ownership,
        categories: formData.categories,
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || null,
        city: formData.city.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        country: formData.country.trim() || "India",
        pincode: formData.pincode.trim(),
        website: normalizeWebsite(formData.website),
        email: formData.email.trim().toLowerCase(),
        admissionEmail: formData.admissionEmail.trim().toLowerCase() || null,
        phone: normalizePhone(formData.phone),
        alternatePhone: formData.alternatePhone.trim()
          ? normalizePhone(formData.alternatePhone)
          : null,
        latitude: formData.latitude.trim() ? Number(formData.latitude) : null,
        longitude: formData.longitude.trim() ? Number(formData.longitude) : null,
        principalName: formData.principalName.trim() || null,
        affiliatedUniversity: formData.affiliatedUniversity.trim() || null,
        naacGrade: formData.naacGrade || null,
        totalStudents: formData.totalStudents.trim()
          ? Number(formData.totalStudents)
          : null,
        tpoName: formData.tpoName.trim(),
        tpoEmail: formData.tpoEmail.trim().toLowerCase(),
      });
      toast.success("College added successfully!");
      setCreated(result);
    } catch (error: any) {
      const apiMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to add college";
      const fieldMapped = mapApiErrorToFields(apiMsg);
      if (Object.keys(fieldMapped).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldMapped }));
        const first = Object.keys(fieldMapped)[0];
        document.getElementById(`college-field-${first}`)?.focus();
      } else {
        setFormError(apiMsg);
      }
      toast.error(apiMsg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.temporary_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select and copy the password manually");
    }
  };

  const show = (field: FieldName) => Boolean(touched[field] && errors[field]);

  if (created) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">College created</h2>
          <p className="text-gray-500 mt-1">
            Save the TPO&apos;s login below now — the password can&apos;t be shown again after you leave this page.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/70 shadow-admin-card p-8 space-y-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">College</div>
            <div className="text-lg font-semibold text-gray-900">{created.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">TPO Name</div>
              <div className="text-gray-900">{created.tpo_name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Login Email</div>
              <div className="text-gray-900">{created.tpo_email}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Temporary Password</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-900">
                {created.temporary_password}
              </code>
              <button
                type="button"
                onClick={copyPassword}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                title="Copy password"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              They&apos;ll be required to set a new password on first login.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => navigate("/app/superadmin/colleges")}
              className="px-6 py-2 bg-navy-900 text-white rounded-lg font-medium hover:bg-navy-800 transition-colors"
            >
              Done — Go to Colleges
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Add New College</h2>
        <p className="text-gray-500 mt-1">
          Register the institution master record and create the TPO login.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-xl border border-gray-200/70 shadow-admin-card p-6 sm:p-8 space-y-8"
      >
        {formError && (
          <div
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {formError}
          </div>
        )}

        {/* 1. Core Identification */}
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Core Identification</h3>
            <p className="text-xs text-gray-500 mt-0.5">Official identity and classification</p>
          </div>

          <div>
            <Label htmlFor="college-field-name" required>
              Official name (full name)
            </Label>
            <input
              id="college-field-name"
              type="text"
              name="name"
              maxLength={255}
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., Indian Institute of Technology Bombay"
              className={inputClass(show("name"))}
              aria-invalid={show("name")}
              aria-describedby={show("name") ? "college-error-name" : undefined}
            />
            <FieldError id="college-error-name" message={show("name") ? errors.name : undefined} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="college-field-shortName">Short name</Label>
              <input
                id="college-field-shortName"
                type="text"
                name="shortName"
                maxLength={50}
                value={formData.shortName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., IITB, SRCC"
                className={inputClass(show("shortName"))}
                aria-invalid={show("shortName")}
              />
              <FieldError
                id="college-error-shortName"
                message={show("shortName") ? errors.shortName : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-establishmentYear" required>
                Establishment year
              </Label>
              <input
                id="college-field-establishmentYear"
                type="number"
                name="establishmentYear"
                min={1800}
                max={CURRENT_YEAR}
                value={formData.establishmentYear}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={`1800–${CURRENT_YEAR}`}
                className={inputClass(show("establishmentYear"))}
                aria-invalid={show("establishmentYear")}
              />
              <FieldError
                id="college-error-establishmentYear"
                message={show("establishmentYear") ? errors.establishmentYear : undefined}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="college-field-institutionType" required>
                Institution type
              </Label>
              <select
                id="college-field-institutionType"
                name="institutionType"
                value={formData.institutionType}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(show("institutionType"))}
                aria-invalid={show("institutionType")}
              >
                <option value="">Select type</option>
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <FieldError
                id="college-error-institutionType"
                message={show("institutionType") ? errors.institutionType : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-ownership" required>
                Ownership
              </Label>
              <select
                id="college-field-ownership"
                name="ownership"
                value={formData.ownership}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(show("ownership"))}
                aria-invalid={show("ownership")}
              >
                <option value="">Select ownership</option>
                {OWNERSHIP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <FieldError
                id="college-error-ownership"
                message={show("ownership") ? errors.ownership : undefined}
              />
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-rose-600">*</span>
            </span>
            <div
              id="college-field-categories"
              className={`flex flex-wrap gap-2 rounded-lg p-3 ${
                show("categories") ? "border border-rose-400 bg-rose-50/40" : "border border-gray-200"
              }`}
              role="group"
              aria-invalid={show("categories")}
            >
              {CATEGORY_OPTIONS.map((cat) => {
                const checked = formData.categories.includes(cat);
                return (
                  <label
                    key={cat}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg cursor-pointer border ${
                      checked
                        ? "border-navy-900 bg-navy-900 text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleCategory(cat)}
                    />
                    {cat}
                  </label>
                );
              })}
            </div>
            <FieldError
              id="college-error-categories"
              message={show("categories") ? errors.categories : undefined}
            />
          </div>
        </section>

        {/* 2. Location & Address */}
        <section className="border-t border-gray-200 pt-8 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Location &amp; Address</h3>
            <p className="text-xs text-gray-500 mt-0.5">Postal address for the campus</p>
          </div>

          <div>
            <Label htmlFor="college-field-addressLine1" required>
              Address line 1
            </Label>
            <input
              id="college-field-addressLine1"
              type="text"
              name="addressLine1"
              maxLength={255}
              value={formData.addressLine1}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Street, building, landmark"
              className={inputClass(show("addressLine1"))}
              aria-invalid={show("addressLine1")}
            />
            <FieldError
              id="college-error-addressLine1"
              message={show("addressLine1") ? errors.addressLine1 : undefined}
            />
          </div>

          <div>
            <Label htmlFor="college-field-addressLine2">Address line 2</Label>
            <input
              id="college-field-addressLine2"
              type="text"
              name="addressLine2"
              maxLength={255}
              value={formData.addressLine2}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Area, locality (optional)"
              className={inputClass(show("addressLine2"))}
            />
            <FieldError
              id="college-error-addressLine2"
              message={show("addressLine2") ? errors.addressLine2 : undefined}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="college-field-city" required>
                City
              </Label>
              <input
                id="college-field-city"
                type="text"
                name="city"
                maxLength={100}
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(show("city"))}
              />
              <FieldError id="college-error-city" message={show("city") ? errors.city : undefined} />
            </div>
            <div>
              <Label htmlFor="college-field-district" required>
                District
              </Label>
              <input
                id="college-field-district"
                type="text"
                name="district"
                maxLength={100}
                value={formData.district}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(show("district"))}
              />
              <FieldError
                id="college-error-district"
                message={show("district") ? errors.district : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-state" required>
                State
              </Label>
              <input
                id="college-field-state"
                type="text"
                name="state"
                maxLength={100}
                value={formData.state}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(show("state"))}
              />
              <FieldError
                id="college-error-state"
                message={show("state") ? errors.state : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-country" required>
                Country
              </Label>
              <input
                id="college-field-country"
                type="text"
                name="country"
                maxLength={100}
                value={formData.country}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(show("country"))}
              />
              <FieldError
                id="college-error-country"
                message={show("country") ? errors.country : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-pincode" required>
                Pincode
              </Label>
              <input
                id="college-field-pincode"
                type="text"
                name="pincode"
                inputMode="numeric"
                maxLength={10}
                value={formData.pincode}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="6 digits"
                className={inputClass(show("pincode"))}
              />
              <FieldError
                id="college-error-pincode"
                message={show("pincode") ? errors.pincode : undefined}
              />
            </div>
          </div>
        </section>

        {/* 3. Contact Information */}
        <section className="border-t border-gray-200 pt-8 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            <p className="text-xs text-gray-500 mt-0.5">Public contact channels</p>
          </div>

          <div>
            <Label htmlFor="college-field-website" required>
              Website
            </Label>
            <input
              id="college-field-website"
              type="url"
              name="website"
              maxLength={255}
              value={formData.website}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://www.college.edu"
              className={inputClass(show("website"))}
            />
            <FieldError
              id="college-error-website"
              message={show("website") ? errors.website : undefined}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="college-field-email" required>
                General email
              </Label>
              <input
                id="college-field-email"
                type="email"
                name="email"
                maxLength={150}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="info@college.edu"
                className={inputClass(show("email"))}
              />
              <FieldError
                id="college-error-email"
                message={show("email") ? errors.email : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-admissionEmail">Admission email</Label>
              <input
                id="college-field-admissionEmail"
                type="email"
                name="admissionEmail"
                maxLength={150}
                value={formData.admissionEmail}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="admissions@college.edu"
                className={inputClass(show("admissionEmail"))}
              />
              <FieldError
                id="college-error-admissionEmail"
                message={show("admissionEmail") ? errors.admissionEmail : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-phone" required>
                Phone number
              </Label>
              <input
                id="college-field-phone"
                type="tel"
                name="phone"
                maxLength={20}
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+919876543210"
                className={inputClass(show("phone"))}
              />
              <FieldError
                id="college-error-phone"
                message={show("phone") ? errors.phone : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-alternatePhone">Alternate phone</Label>
              <input
                id="college-field-alternatePhone"
                type="tel"
                name="alternatePhone"
                maxLength={20}
                value={formData.alternatePhone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+911234567890"
                className={inputClass(show("alternatePhone"))}
              />
              <FieldError
                id="college-error-alternatePhone"
                message={show("alternatePhone") ? errors.alternatePhone : undefined}
              />
            </div>
          </div>
        </section>

        {/* Additional recommended */}
        <section className="border-t border-gray-200 pt-8 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Additional details</h3>
            <p className="text-xs text-gray-500 mt-0.5">Optional but useful for maps and accreditation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="college-field-latitude">Latitude</Label>
              <input
                id="college-field-latitude"
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., 19.1334"
                className={inputClass(show("latitude"))}
              />
              <FieldError
                id="college-error-latitude"
                message={show("latitude") ? errors.latitude : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-longitude">Longitude</Label>
              <input
                id="college-field-longitude"
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., 72.9133"
                className={inputClass(show("longitude"))}
              />
              <FieldError
                id="college-error-longitude"
                message={show("longitude") ? errors.longitude : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-principalName">Principal name</Label>
              <input
                id="college-field-principalName"
                type="text"
                name="principalName"
                maxLength={150}
                value={formData.principalName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(show("principalName"))}
              />
            </div>
            <div>
              <Label
                htmlFor="college-field-affiliatedUniversity"
                required={formData.institutionType === "Affiliated College"}
              >
                Affiliated university
              </Label>
              <input
                id="college-field-affiliatedUniversity"
                type="text"
                name="affiliatedUniversity"
                maxLength={200}
                value={formData.affiliatedUniversity}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={
                  formData.institutionType === "Affiliated College"
                    ? "Required for Affiliated College"
                    : "Optional"
                }
                className={inputClass(show("affiliatedUniversity"))}
              />
              <FieldError
                id="college-error-affiliatedUniversity"
                message={show("affiliatedUniversity") ? errors.affiliatedUniversity : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-naacGrade">NAAC grade</Label>
              <select
                id="college-field-naacGrade"
                name="naacGrade"
                value={formData.naacGrade}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(show("naacGrade"))}
              >
                <option value="">Not specified</option>
                {NAAC_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="college-field-totalStudents">Total students</Label>
              <input
                id="college-field-totalStudents"
                type="number"
                name="totalStudents"
                min={0}
                value={formData.totalStudents}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(show("totalStudents"))}
              />
              <FieldError
                id="college-error-totalStudents"
                message={show("totalStudents") ? errors.totalStudents : undefined}
              />
            </div>
          </div>
        </section>

        {/* TPO / platform login */}
        <section className="border-t border-gray-200 pt-8 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Training &amp; Placement Officer
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              TPO email becomes the college admin login and must be unique.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="college-field-tpoName" required>
                TPO name
              </Label>
              <input
                id="college-field-tpoName"
                type="text"
                name="tpoName"
                value={formData.tpoName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(show("tpoName"))}
              />
              <FieldError
                id="college-error-tpoName"
                message={show("tpoName") ? errors.tpoName : undefined}
              />
            </div>
            <div>
              <Label htmlFor="college-field-tpoEmail" required>
                TPO email (login)
              </Label>
              <input
                id="college-field-tpoEmail"
                type="email"
                name="tpoEmail"
                value={formData.tpoEmail}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="tpo@college.edu"
                className={inputClass(show("tpoEmail"))}
              />
              <FieldError
                id="college-error-tpoEmail"
                message={show("tpoEmail") ? errors.tpoEmail : undefined}
              />
            </div>
          </div>
        </section>

        <div className="border-t border-gray-200 pt-6 flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/app/superadmin/colleges")}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-navy-900 text-white rounded-lg font-medium hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create College"}
          </button>
        </div>
      </form>
    </div>
  );
}

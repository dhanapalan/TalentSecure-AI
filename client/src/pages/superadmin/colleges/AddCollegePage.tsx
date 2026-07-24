import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, Copy } from "lucide-react";
import collegeService, { CreateCollegeResult } from "../../../services/collegeService";

interface CollegeFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  tpoName: string;
  tpoEmail: string;
  studentLimit: number;
}

type FieldName = keyof CollegeFormData;
type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{10,15}$/;

const EMPTY_FORM: CollegeFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  tpoName: "",
  tpoEmail: "",
  studentLimit: 100,
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

function validateFields(formData: CollegeFormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!formData.name.trim()) {
    errors.name = "College name is required";
  } else if (formData.name.trim().length < 3) {
    errors.name = "College name must be at least 3 characters";
  }

  if (!formData.email.trim()) {
    errors.email = "College email is required";
  } else if (!EMAIL_RE.test(formData.email.trim())) {
    errors.email = "Enter a valid college email address";
  }

  const phoneDigits = formData.phone.replace(/[\s\-()]/g, "");
  if (!formData.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!PHONE_RE.test(phoneDigits)) {
    errors.phone = "Enter a valid phone (10–15 digits, optional + country code)";
  }

  if (!formData.address.trim()) {
    errors.address = "Address is required";
  } else if (formData.address.trim().length < 5) {
    errors.address = "Enter a complete street address";
  }

  if (!formData.city.trim()) {
    errors.city = "City is required";
  }

  if (!formData.state.trim()) {
    errors.state = "State is required";
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
    errors.tpoEmail = "TPO login email must be different from the college email";
  }

  if (!Number.isFinite(formData.studentLimit) || Number.isNaN(formData.studentLimit)) {
    errors.studentLimit = "Student limit is required";
  } else if (formData.studentLimit < 10) {
    errors.studentLimit = "Student limit must be at least 10";
  } else if (formData.studentLimit > 10000) {
    errors.studentLimit = "Student limit cannot exceed 10,000";
  }

  return errors;
}

/** Map API 409/400 messages onto the field that caused them. */
function mapApiErrorToFields(apiMsg: string): FieldErrors {
  const lower = apiMsg.toLowerCase();
  if (lower.includes("college with this email") || lower.includes("email already exists")) {
    return { email: apiMsg };
  }
  if (lower.includes("tpo email") || lower.includes("user with this tpo")) {
    return { tpoEmail: apiMsg };
  }
  if (lower.includes("phone")) {
    return { phone: apiMsg };
  }
  if (lower.includes("missing required")) {
    return { name: apiMsg };
  }
  return {};
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

  const setField = (name: FieldName, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormError(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const field = name as FieldName;
    setField(field, field === "studentLimit" ? parseInt(value, 10) || 0 : value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = e.target.name as FieldName;
    setTouched((prev) => ({ ...prev, [field]: true }));
    const next = validateFields({
      ...formData,
      [field]:
        field === "studentLimit"
          ? formData.studentLimit
          : (formData[field] as string),
    });
    setErrors((prev) => {
      const merged = { ...prev };
      if (next[field]) merged[field] = next[field];
      else delete merged[field];
      return merged;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nextErrors = validateFields(formData);
    setErrors(nextErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      tpoName: true,
      tpoEmail: true,
      studentLimit: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`college-field-${first}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const result = await collegeService.createCollege({
        ...formData,
        email: formData.email.trim(),
        tpoEmail: formData.tpoEmail.trim(),
        name: formData.name.trim(),
        tpoName: formData.tpoName.trim(),
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Add New College</h2>
        <p className="text-gray-500 mt-1">Register a new college on the platform.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-xl border border-gray-200/70 shadow-admin-card p-8 space-y-6"
      >
        {formError && (
          <div
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {formError}
          </div>
        )}

        {/* College Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">College Information</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="college-field-name" className="block text-sm font-medium text-gray-700 mb-1">
                College Name *
              </label>
              <input
                id="college-field-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., MIT College of Engineering"
                className={inputClass(show("name"))}
                aria-invalid={show("name")}
                aria-describedby={show("name") ? "college-error-name" : undefined}
              />
              <FieldError id="college-error-name" message={show("name") ? errors.name : undefined} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="college-field-email" className="block text-sm font-medium text-gray-700 mb-1">
                  College Email *
                </label>
                <input
                  id="college-field-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="admin@college.edu"
                  className={inputClass(show("email"))}
                  aria-invalid={show("email")}
                  aria-describedby={show("email") ? "college-error-email" : undefined}
                />
                <FieldError id="college-error-email" message={show("email") ? errors.email : undefined} />
              </div>
              <div>
                <label htmlFor="college-field-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  id="college-field-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+91 98765 43210"
                  className={inputClass(show("phone"))}
                  aria-invalid={show("phone")}
                  aria-describedby={show("phone") ? "college-error-phone" : undefined}
                />
                <FieldError id="college-error-phone" message={show("phone") ? errors.phone : undefined} />
              </div>
            </div>

            <div>
              <label htmlFor="college-field-address" className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                id="college-field-address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Street address"
                rows={3}
                className={inputClass(show("address"))}
                aria-invalid={show("address")}
                aria-describedby={show("address") ? "college-error-address" : undefined}
              />
              <FieldError id="college-error-address" message={show("address") ? errors.address : undefined} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="college-field-city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  id="college-field-city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Bangalore"
                  className={inputClass(show("city"))}
                  aria-invalid={show("city")}
                  aria-describedby={show("city") ? "college-error-city" : undefined}
                />
                <FieldError id="college-error-city" message={show("city") ? errors.city : undefined} />
              </div>
              <div>
                <label htmlFor="college-field-state" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  id="college-field-state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Karnataka"
                  className={inputClass(show("state"))}
                  aria-invalid={show("state")}
                  aria-describedby={show("state") ? "college-error-state" : undefined}
                />
                <FieldError id="college-error-state" message={show("state") ? errors.state : undefined} />
              </div>
            </div>
          </div>
        </div>

        {/* TPO Information */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Training &amp; Placement Officer</h3>
          <p className="text-xs text-gray-500 mb-4">
            TPO email becomes the college admin login and must be unique (not already registered).
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="college-field-tpoName" className="block text-sm font-medium text-gray-700 mb-1">
                TPO Name *
              </label>
              <input
                id="college-field-tpoName"
                type="text"
                name="tpoName"
                value={formData.tpoName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Dr. Rajesh Kumar"
                className={inputClass(show("tpoName"))}
                aria-invalid={show("tpoName")}
                aria-describedby={show("tpoName") ? "college-error-tpoName" : undefined}
              />
              <FieldError id="college-error-tpoName" message={show("tpoName") ? errors.tpoName : undefined} />
            </div>
            <div>
              <label htmlFor="college-field-tpoEmail" className="block text-sm font-medium text-gray-700 mb-1">
                TPO Email (login) *
              </label>
              <input
                id="college-field-tpoEmail"
                type="email"
                name="tpoEmail"
                value={formData.tpoEmail}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="tpo@college.edu"
                className={inputClass(show("tpoEmail"))}
                aria-invalid={show("tpoEmail")}
                aria-describedby={show("tpoEmail") ? "college-error-tpoEmail" : undefined}
              />
              <FieldError id="college-error-tpoEmail" message={show("tpoEmail") ? errors.tpoEmail : undefined} />
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
          <div>
            <label htmlFor="college-field-studentLimit" className="block text-sm font-medium text-gray-700 mb-1">
              Student Limit per Year *
            </label>
            <input
              id="college-field-studentLimit"
              type="number"
              name="studentLimit"
              value={formData.studentLimit}
              onChange={handleChange}
              onBlur={handleBlur}
              min={10}
              max={10000}
              className={inputClass(show("studentLimit"))}
              aria-invalid={show("studentLimit")}
              aria-describedby={
                show("studentLimit") ? "college-error-studentLimit" : "college-hint-studentLimit"
              }
            />
            <FieldError
              id="college-error-studentLimit"
              message={show("studentLimit") ? errors.studentLimit : undefined}
            />
            {!show("studentLimit") && (
              <p id="college-hint-studentLimit" className="text-xs text-gray-500 mt-1">
                Maximum students that can be registered from this college (10–10,000)
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
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

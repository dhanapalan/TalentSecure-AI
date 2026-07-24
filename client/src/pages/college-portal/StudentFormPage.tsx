/**
 * Sprint 2.2 — Add / Edit Student (college portal).
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RotateCcw, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import campusStudentsService from "../../services/campusStudentsService";
import campusDepartmentsService from "../../services/campusDepartmentsService";

const PLACEMENT_STATUSES = [
  "Not Shortlisted",
  "Shortlisted",
  "Interviewed",
  "Offered",
  "Joined",
] as const;

const GENDERS = [
  { value: "", label: "Select" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export type StudentFormState = {
  roll_number: string;
  register_number: string;
  name: string;
  gender: string;
  dob: string;
  email: string;
  phone_number: string;
  branch: string;
  program: string;
  semester: string;
  section: string;
  academic_start_year: string;
  academic_end_year: string;
  cgpa: string;
  placement_eligible: boolean;
  placement_status: string;
};

const EMPTY: StudentFormState = {
  roll_number: "",
  register_number: "",
  name: "",
  gender: "",
  dob: "",
  email: "",
  phone_number: "",
  branch: "",
  program: "",
  semester: "",
  section: "",
  academic_start_year: "",
  academic_end_year: "",
  cgpa: "",
  placement_eligible: false,
  placement_status: "Not Shortlisted",
};

function validateYear(value: string, label: string): string | null {
  if (!value.trim()) return null;
  const y = Number(value);
  if (!Number.isInteger(y) || y < 1900 || y > 2200) {
    return `${label} must be a valid year.`;
  }
  return null;
}

function validate(form: StudentFormState, isCreate: boolean): string | null {
  if (!form.roll_number.trim()) return "Roll Number is required.";
  if (!form.name.trim()) return "Student Name is required.";
  if (!form.branch.trim()) return "Branch is required.";
  if (!form.academic_end_year.trim()) return "Academic end year is required.";
  if (isCreate && !form.email.trim()) return "Email is required.";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Enter a valid email address.";
  }
  if (
    form.phone_number.trim() &&
    !/^\d{7,15}$/.test(form.phone_number.replace(/[\s\-()+]/g, ""))
  ) {
    return "Enter a valid mobile number (7–15 digits).";
  }
  if (form.cgpa.trim()) {
    const n = Number(form.cgpa);
    if (Number.isNaN(n) || n < 0 || n > 10) return "CGPA must be between 0 and 10.";
  }
  const startErr = validateYear(form.academic_start_year, "Academic start year");
  if (startErr) return startErr;
  const endErr = validateYear(form.academic_end_year, "Academic end year");
  if (endErr) return endErr;
  if (
    form.academic_start_year.trim() &&
    form.academic_end_year.trim() &&
    Number(form.academic_start_year) > Number(form.academic_end_year)
  ) {
    return "Academic start year must be on or before end year.";
  }
  return null;
}

function toPayload(form: StudentFormState) {
  return {
    roll_number: form.roll_number.trim(),
    register_number: form.register_number.trim() || null,
    name: form.name.trim(),
    gender: form.gender || null,
    dob: form.dob || null,
    email: form.email.trim() || null,
    phone_number: form.phone_number.trim() || null,
    branch: form.branch.trim(),
    department: form.branch.trim(),
    program: form.program.trim() || null,
    semester: form.semester.trim() || null,
    section: form.section.trim() || null,
    academic_start_year: form.academic_start_year.trim()
      ? Number(form.academic_start_year)
      : null,
    academic_end_year: form.academic_end_year.trim()
      ? Number(form.academic_end_year)
      : null,
    cgpa: form.cgpa.trim() ? Number(form.cgpa) : null,
    placement_eligible: form.placement_eligible,
    placement_status: form.placement_status || "Not Shortlisted",
  };
}

export default function StudentFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StudentFormState>(EMPTY);
  const [baseline, setBaseline] = useState<StudentFormState>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ["college-portal-student", id],
    queryFn: () => campusStudentsService.get(id!),
    enabled: isEdit,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["campus-departments"],
    queryFn: () => campusDepartmentsService.list(),
  });
  const departmentOptions = departments.some((d) => d.name === form.branch)
    ? departments
    : form.branch
      ? [...departments, { id: "current", name: form.branch, college_id: "", is_active: true, created_at: "", updated_at: "" }]
      : departments;

  useEffect(() => {
    if (!data?.overview) return;
    const o = data.overview;
    const next: StudentFormState = {
      roll_number: o.roll_number ?? "",
      register_number: o.register_number ?? "",
      name: o.name ?? "",
      gender: o.gender ?? "",
      dob: o.dob ? String(o.dob).slice(0, 10) : "",
      email: o.email ?? "",
      phone_number: o.phone_number ?? "",
      branch: o.branch ?? o.department ?? o.specialization ?? "",
      program: o.program ?? o.degree ?? "",
      semester: o.semester ?? "",
      section: o.section ?? "",
      academic_start_year:
        o.academic_start_year != null ? String(o.academic_start_year) : "",
      academic_end_year:
        o.academic_end_year != null
          ? String(o.academic_end_year)
          : o.academic_year != null
            ? String(o.academic_year)
            : o.passing_year != null
              ? String(o.passing_year)
              : "",
      cgpa: o.cgpa != null ? String(o.cgpa) : "",
      placement_eligible: Boolean(o.placement_eligible),
      placement_status: o.placement_status || "Not Shortlisted",
    };
    setForm(next);
    setBaseline(next);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = toPayload(form);
      if (isEdit) return campusStudentsService.update(id!, payload);
      return campusStudentsService.create(payload as never);
    },
    onSuccess: (res: {
      data?: { id?: string; temporary_password?: string };
      message?: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: ["college-portal-students"] });
      queryClient.invalidateQueries({ queryKey: ["college-portal-student", id] });
      queryClient.invalidateQueries({ queryKey: ["college-portal-students-analytics"] });
      const temp = res?.data?.temporary_password;
      if (temp) toast.success(`Student created. Temporary password: ${temp}`);
      else toast.success(isEdit ? "Student updated." : "Student created.");
      const newId = res?.data?.id || id;
      if (newId) navigate(`/app/college-portal/students/${newId}`);
      else navigate("/app/college-portal/students");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error ?? "Failed to save student.");
    },
  });

  const set =
    (key: keyof StudentFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((f) => ({ ...f, [key]: value as never }));
    };

  const onSubmit = () => {
    const msg = validate(form, !isEdit);
    if (msg) {
      toast.error(msg);
      return;
    }
    saveMutation.mutate();
  };

  const onCancel = () => {
    navigate(isEdit ? `/app/college-portal/students/${id}` : "/app/college-portal/students");
  };

  const onReset = () => {
    setForm(isEdit ? baseline : EMPTY);
  };

  if (isEdit && isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-admin-accent"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {isEdit ? "Edit Student" : "Add Student"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? "Update campus student master data"
              : "Create a new student on your campus roster"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription>Identity and contact details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Roll Number *" value={form.roll_number} onChange={set("roll_number")} required />
          <Field
            label="Register Number"
            value={form.register_number}
            onChange={set("register_number")}
          />
          <Field
            label="Student Name *"
            value={form.name}
            onChange={set("name")}
            required
            className="sm:col-span-2"
          />
          <label className="block text-xs font-medium text-gray-600">
            Gender
            <select
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              value={form.gender}
              onChange={set("gender")}
            >
              {GENDERS.map((g) => (
                <option key={g.value || "none"} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <Field label="Date of Birth" type="date" value={form.dob} onChange={set("dob")} />
          <Field
            label={isEdit ? "Email" : "Email *"}
            type="email"
            value={form.email}
            onChange={set("email")}
            required={!isEdit}
          />
          <Field label="Mobile" value={form.phone_number} onChange={set("phone_number")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Academic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-gray-600">
            Branch *
            <select
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              value={form.branch}
              onChange={set("branch")}
              required
            >
              <option value="">Select branch…</option>
              {departmentOptions.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            {departments.length === 0 && (
              <Link
                to="/app/college-portal/settings/departments"
                className="mt-1 block text-xs text-admin-accent hover:underline"
              >
                No branches configured — add one under Departments
              </Link>
            )}
          </label>
          <Field label="Program" value={form.program} onChange={set("program")} placeholder="e.g. B.E" />
          <Field
            label="Academic start year"
            type="number"
            value={form.academic_start_year}
            onChange={set("academic_start_year")}
            placeholder="e.g. 2022"
          />
          <Field
            label="Academic end year *"
            type="number"
            value={form.academic_end_year}
            onChange={set("academic_end_year")}
            placeholder="e.g. 2026"
            required
          />
          <Field label="Semester" value={form.semester} onChange={set("semester")} />
          <Field label="Section" value={form.section} onChange={set("section")} />
          <Field
            label="CGPA"
            type="number"
            value={form.cgpa}
            onChange={set("cgpa")}
            placeholder="0 – 10"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Placement Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.placement_eligible}
              onChange={set("placement_eligible")}
              className="rounded border-gray-300"
            />
            Placement Eligible
          </label>
          <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
            Placement Status
            <select
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              value={form.placement_status}
              onChange={set("placement_status")}
            >
              {PLACEMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saveMutation.isPending}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button type="button" variant="outline" onClick={onReset} disabled={saveMutation.isPending}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button type="button" onClick={onSubmit} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Saving…" : isEdit ? "Update" : "Add"}
        </Button>
      </div>

      {!isEdit && (
        <p className="text-center text-xs text-gray-500">
          Prefer the quick modal?{" "}
          <Link to="/app/college-portal/students" className="text-admin-accent hover:underline">
            Back to roster
          </Link>
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={`block text-xs font-medium text-gray-600 ${className}`}>
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
      />
    </label>
  );
}

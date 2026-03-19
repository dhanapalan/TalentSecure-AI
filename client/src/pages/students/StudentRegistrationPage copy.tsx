import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, GraduationCap, ArrowRight } from "lucide-react";
import Logo from "../../components/Logo";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function StudentRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collegeCode = searchParams.get("college") ?? "";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", rollNumber: "",
    college: collegeCode, major: "", degree: "B.Tech", graduationYear: "2025",
    cgpa: "",
  });

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post("/students/bulk", { students: [form] });
      toast.success("Registration successful! Check your email for login details.");
      setStep(3);
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <Logo size={36} />
        <span className="text-xl font-bold text-slate-800">GradLogic</span>
      </div>

      {step === 3 ? (
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Registration Complete!</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your account has been created. You'll receive login credentials at <strong>{form.email}</strong> shortly.
          </p>
          <button
            onClick={() => navigate("/auth/login")}
            className="mt-6 w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-100 shadow-sm p-8">
          {/* Steps */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= n ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {n}
                </div>
                {n < 2 && <div className={`flex-1 h-0.5 w-10 ${step > n ? "bg-indigo-600" : "bg-slate-200"}`} />}
              </div>
            ))}
            <span className="ml-2 text-xs text-slate-400">{step === 1 ? "Personal Info" : "Academic Info"}</span>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Registration</h2>
              <p className="text-xs text-slate-400">Step {step} of 2</p>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[["firstName", "First Name", "Arjun"], ["lastName", "Last Name", "Sharma"]].map(([key, label, ph]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                    <input
                      value={(form as any)[key]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={ph}
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
              {[["email", "Email Address", "arjun@iitd.ac.in", "email"], ["phone", "Phone Number", "+91-98765-43210", "tel"]].map(([key, label, ph, type]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={ph}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <button
                onClick={() => setStep(2)}
                disabled={!form.firstName || !form.email}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {[["rollNumber", "Roll Number", "CS21001"], ["college", "College / University", "IIT Delhi"]].map(([key, label, ph]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                  <input
                    value={(form as any)[key]}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={ph}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Degree</label>
                  <select value={form.degree} onChange={(e) => update("degree", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {["B.Tech", "B.E.", "M.Tech", "M.E.", "MCA", "MBA"].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Pass-out Year</label>
                  <select value={form.graduationYear} onChange={(e) => update("graduationYear", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {["2025", "2026", "2027"].map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Major / Specialization</label>
                <input value={form.major} onChange={(e) => update("major", e.target.value)} placeholder="Computer Science" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">CGPA</label>
                <input type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={(e) => update("cgpa", e.target.value)} placeholder="8.7" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.rollNumber}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Register"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

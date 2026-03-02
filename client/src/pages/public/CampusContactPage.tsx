import { useState } from "react";
import { Link } from "react-router";
import { MapPin, Mail, Phone, CheckCircle } from "lucide-react";

export default function CampusContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", college: "", students: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-900 py-20 px-6 text-center text-white">
        <h1 className="text-4xl font-black">Partner With Us</h1>
        <p className="mt-4 max-w-xl mx-auto text-indigo-200">
          Join 500+ campuses using Nallas Connect to streamline their placement drives.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16">
        {/* Info */}
        <div>
          <h2 className="text-2xl font-black text-gray-900">Get In Touch</h2>
          <p className="mt-4 text-gray-500 leading-relaxed">
            Fill out the form and our campus partnerships team will reach out within 24 hours to schedule a demo.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { icon: Mail, text: "campus@nallas.com" },
              { icon: Phone, text: "+91-80-6717-8000" },
              { icon: MapPin, text: "Bengaluru, Karnataka, India" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-gray-600">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-indigo-50 p-6 border border-indigo-100">
            <h3 className="font-bold text-gray-900">What's included?</h3>
            <ul className="mt-4 space-y-2">
              {["Dedicated placement portal", "Bulk student onboarding", "Live proctoring dashboard", "Result analytics & reports", "Priority support"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Form */}
        <div>
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">Request Sent!</h3>
              <p className="mt-2 text-gray-500 text-sm">Our team will reach out within 24 hours.</p>
              <Link to="/campus" className="mt-6 text-sm text-indigo-600 hover:underline">← Back to Campus page</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Campus Partnership Request</h3>
              {[
                { label: "Your Name", key: "name", type: "text", placeholder: "Dr. Ramesh Kumar" },
                { label: "Official Email", key: "email", type: "email", placeholder: "admin@college.ac.in" },
                { label: "College / University Name", key: "college", type: "text", placeholder: "IIT Delhi" },
                { label: "Approx. Student Count", key: "students", type: "number", placeholder: "500" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message (optional)</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  placeholder="Tell us about your placement requirements..."
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 text-sm font-semibold transition-colors"
              >
                Send Partnership Request
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

import { Link } from "react-router";

export default function CampusPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-900 text-white py-24 px-6 text-center">
        <h1 className="text-5xl font-black tracking-tight">Campus <span className="text-indigo-400">Recruiting</span></h1>
        <p className="mt-6 max-w-xl mx-auto text-lg text-slate-400">End-to-end campus hiring with AI proctoring, bulk onboarding, and intelligent talent segmentation.</p>
        <Link to="/campus/contact" className="mt-8 inline-block rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold hover:bg-indigo-700 transition-colors">Partner With Us</Link>
      </div>
      <div className="max-w-5xl mx-auto py-20 px-6 grid md:grid-cols-3 gap-8">
        {["Bulk Student Onboarding", "AI-Verified Assessments", "Live Proctoring Engine"].map((f) => (
          <div key={f} className="rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h3 className="font-black text-gray-900">{f}</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">Industry-leading campus recruitment infrastructure trusted by 500+ institutions across India.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

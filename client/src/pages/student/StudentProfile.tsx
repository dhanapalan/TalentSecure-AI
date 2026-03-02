import { Edit2 } from "lucide-react";

export default function StudentProfile() {
  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-gray-900 text-base" style={{ fontWeight: 700 }}>My Profile</h3>
          <button className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl" style={{ fontWeight: 800 }}>AS</div>
          <div>
            <h2 className="text-gray-900 text-lg" style={{ fontWeight: 700 }}>Arjun Sharma</h2>
            <p className="text-gray-400 text-sm">CS21001 · IIT Delhi</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Degree", value: "B.Tech CSE" },
            { label: "Batch", value: "2025" },
            { label: "CGPA", value: "8.7" },
            { label: "Email", value: "arjun.s@iitd.ac.in" },
          ].map(f => (
            <div key={f.label} className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-500 text-xs">{f.label}</p>
              <p className="text-gray-800 text-sm mt-0.5" style={{ fontWeight: 500 }}>{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

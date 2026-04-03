import { ShieldCheck, GraduationCap, UserCircle2, ArrowRight } from "lucide-react";

export default function LandingPage() {
    const portals = [
        {
            name: "Admin Portal",
            description: "Manage recruitment operations, drives, and assessments.",
            icon: ShieldCheck,
            url: import.meta.env.VITE_ADMIN_APP_URL || "https://admin.gradlogic.atherasys.com",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-100",
            hoverRing: "hover:ring-indigo-500",
            hoverShadow: "hover:shadow-indigo-500/20",
            gradient: "from-indigo-500 to-blue-600"
        },
        {
            name: "Campus Portal",
            description: "Manage college placements, track student performance, and coordinate drives.",
            icon: GraduationCap,
            url: import.meta.env.VITE_COLLEGE_APP_URL || "https://campus.gradlogic.atherasys.com",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            hoverRing: "hover:ring-emerald-500",
            hoverShadow: "hover:shadow-emerald-500/20",
            gradient: "from-emerald-500 to-teal-600"
        },
        {
            name: "Student Portal",
            description: "Take assessments, view job opportunities, and track your applications.",
            icon: UserCircle2,
            url: import.meta.env.VITE_STUDENT_APP_URL || "https://exam.gradlogic.atherasys.com",
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-100",
            hoverRing: "hover:ring-purple-500",
            hoverShadow: "hover:shadow-purple-500/20",
            gradient: "from-purple-500 to-fuchsia-600"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-indigo-50/50 to-slate-100" />

            {/* Decorative Blobs */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none" />

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative z-10 w-full max-w-6xl px-6 py-12">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 mb-8">
                        <img src="/nallas-logo.png" alt="GradLogic" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <span className="text-lg font-bold text-slate-800 tracking-tight ml-2">GradLogic</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
                        Welcome to the Platform
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Select your specialized portal below to access tools, dashboards, and workflows tailored for your role.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {portals.map((portal) => (
                        <a
                            key={portal.name}
                            href={portal.url}
                            className={`group relative flex flex-col bg-white rounded-3xl p-8 border border-slate-200 transition-all duration-300 hover:-translate-y-2 ring-2 ring-transparent ${portal.hoverRing} hover:shadow-2xl ${portal.hoverShadow}`}
                        >
                            <div className="flex-1">
                                <div className={`inline-flex items-center justify-center p-4 rounded-2xl ${portal.bg} ${portal.border} mb-6 transition-transform group-hover:scale-110 duration-300`}>
                                    <portal.icon className={`w-8 h-8 ${portal.color}`} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors">
                                    {portal.name}
                                </h2>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    {portal.description}
                                </p>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                                <span className={`text-sm font-semibold text-slate-500 group-hover:${portal.color} transition-colors`}>
                                    Enter Portal
                                </span>
                                <div className={`w-8 h-8 rounded-full ${portal.bg} flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300`}>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-sm text-slate-500 font-medium">
                        &copy; {new Date().getFullYear()} GradLogic. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

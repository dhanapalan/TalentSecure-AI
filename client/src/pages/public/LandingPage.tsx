import { ShieldCheck, GraduationCap, UserCircle2, ArrowRight } from "lucide-react";

export default function LandingPage() {
    const portals = [
        {
            name: "Admin",
            description: "Manage recruitment operations, drives, and assessments.",
            icon: ShieldCheck,
            url: import.meta.env.VITE_ADMIN_APP_URL || "https://admin.gradlogic.atherasys.com",
            bg: "bg-[#E5E7FE]", // Light indigo/lavender
            hoverBg: "hover:bg-[#d8dbfe]",
            iconColor: "text-indigo-600",
            imgBg: "bg-indigo-50/80"
        },
        {
            name: "Campus",
            description: "Coordinate drives and track student placement performance.",
            icon: GraduationCap,
            url: import.meta.env.VITE_COLLEGE_APP_URL || "https://campus.gradlogic.atherasys.com",
            bg: "bg-[#FFEDD5]", // Light peach/orange
            hoverBg: "hover:bg-[#fed7aa]",
            iconColor: "text-orange-600",
            imgBg: "bg-orange-50/80"
        },
        {
            name: "Student",
            description: "Take assessments, view job opportunities, and track applications.",
            icon: UserCircle2,
            url: import.meta.env.VITE_STUDENT_APP_URL || "https://exam.gradlogic.atherasys.com",
            bg: "bg-[#DBEAFE]", // Light blue
            hoverBg: "hover:bg-[#bfdbfe]",
            iconColor: "text-blue-600",
            imgBg: "bg-blue-50/80"
        }
    ];

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50" />

            <div className="relative z-10 w-full max-w-6xl px-6 py-12">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-8">
                        <img src="/nallas-logo.png" alt="GradLogic" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <span className="text-lg font-bold text-slate-800 tracking-tight ml-2">GradLogic</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                        How would you like to start?
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                        Select your specialized portal to access tools and dashboards tailored for your role.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 sm:px-12">
                    {portals.map((portal) => (
                        <a
                            key={portal.name}
                            href={portal.url}
                            className={`group relative flex flex-col pt-8 px-5 pb-5 rounded-[2rem] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${portal.bg} ${portal.hoverBg} cursor-pointer overflow-hidden aspect-[4/5] sm:aspect-auto sm:h-[420px]`}
                        >
                            {/* Header Content */}
                            <div className="text-center mb-6 px-2">
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">
                                    {portal.name}
                                </h2>
                                <p className="text-slate-700 text-sm font-medium opacity-80">
                                    {portal.description}
                                </p>
                            </div>

                            {/* Graphic Area */}
                            <div className={`mt-auto w-full h-full min-h-[200px] rounded-2xl relative overflow-hidden flex items-center justify-center shadow-sm border border-white/60 bg-white/50 transition-all duration-500`}>
                                <div className={`absolute inset-0 opacity-40 blur-2xl ${portal.imgBg} rounded-full transform scale-150`}></div>
                                <portal.icon className={`w-28 h-28 ${portal.iconColor} opacity-90 relative z-10 transition-transform duration-500 group-hover:scale-110`} strokeWidth={1.5} />
                                
                                {/* Enter Portal Overlay (Hidden until hover) */}
                                <div className="absolute inset-0 bg-white/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                                     <div className="px-6 py-3 bg-white rounded-full flex items-center gap-2 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                          <span className={`text-sm font-bold ${portal.iconColor}`}>Enter Portal</span>
                                          <ArrowRight className={`w-4 h-4 ${portal.iconColor}`} />
                                     </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-sm text-slate-400 font-medium">
                        &copy; {new Date().getFullYear()} GradLogic. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

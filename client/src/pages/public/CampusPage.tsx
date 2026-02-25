import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

function useFadeIn() {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.opacity = "0";
        el.style.transform = "translateY(24px)";
        el.style.transition = "opacity 0.7s ease-out, transform 0.7s ease-out";
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.style.opacity = "1";
                    el.style.transform = "translateY(0)";
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return ref;
}

export default function CampusPage() {
    return (
        <div className="pt-24">
            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 py-24 sm:py-32">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-600/20 blur-[128px]" />
                    <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-teal-500/15 blur-[128px]" />
                </div>
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                        <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                        </svg>
                        <span className="text-xs font-semibold text-emerald-300 uppercase tracking-widest">Campus Hiring</span>
                    </div>

                    <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
                        One platform for{" "}
                        <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                            campus recruitment
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
                        Run end-to-end campus drives — from registration and assessments to proctored exams, interviews, and offer management — across hundreds of colleges, on one platform.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            to="/campus/contact"
                            className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-2xl shadow-emerald-600/30 hover:bg-emerald-500 hover:shadow-emerald-500/40 transition-all active:scale-95"
                        >
                            Register Your College
                            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </Link>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/10 transition-all active:scale-95"
                        >
                            Book a Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Features ─────────────────────────────────────────────────── */}
            <FeaturesGrid />

            {/* ── How It Works ─────────────────────────────────────────────── */}
            <HowItWorks />

            {/* ── Stats ────────────────────────────────────────────────────── */}
            <StatsBar />

            {/* ── CTA ──────────────────────────────────────────────────────── */}
            <CTABanner />
        </div>
    );
}

/* ─── Features Grid ────────────────────────────────────────────────────── */
function FeaturesGrid() {
    const ref = useFadeIn();
    const features = [
        {
            title: "Drive Management",
            desc: "Plan, schedule, and manage campus drives across hundreds of colleges. Track college-wise registrations, shortlists, and placement stats in real-time.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
            ),
            color: "text-emerald-600", bg: "bg-emerald-50", accent: "from-emerald-500 to-teal-600",
        },
        {
            title: "Placement ERP",
            desc: "Digital portal for colleges — student data management, department-wise tracking, company catalog, TPO dashboards, and automated notifications to students.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
            ),
            color: "text-teal-600", bg: "bg-teal-50", accent: "from-teal-500 to-cyan-600",
        },
        {
            title: "Bulk Student Registration",
            desc: "Import student data via Excel/CSV or share self-registration links. Support for multiple branches, departments, and batch years simultaneously.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
            ),
            color: "text-blue-600", bg: "bg-blue-50", accent: "from-blue-500 to-indigo-600",
        },
        {
            title: "Exam Platform",
            desc: "Create MCQ, coding, descriptive, and case-study exams with configurable time limits, randomised question pools, section-wise scoring, and instant results.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
            ),
            color: "text-violet-600", bg: "bg-violet-50", accent: "from-violet-500 to-purple-600",
        },
        {
            title: "AI Proctoring",
            desc: "Full-screen lock-down, webcam monitoring, face detection, impersonation alerts, tab-switch tracking, and AI-generated incident reports per candidate.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
            ),
            color: "text-pink-600", bg: "bg-pink-50", accent: "from-pink-500 to-rose-600",
        },
        {
            title: "Video Interviews",
            desc: "Live panel interviews and async video screening specifically designed for high-volume campus hiring — handle 500+ interviews in a single drive.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
            ),
            color: "text-amber-600", bg: "bg-amber-50", accent: "from-amber-500 to-orange-600",
        },
        {
            title: "Offer & Onboarding",
            desc: "Auto-generate offer letters, send bulk offers with e-signature, track acceptance rates, and manage joining documentation — all college-wise.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
                </svg>
            ),
            color: "text-cyan-600", bg: "bg-cyan-50", accent: "from-cyan-500 to-blue-600",
        },
        {
            title: "Analytics & Reports",
            desc: "Drive-level dashboards, college comparison reports, department-wise placement stats, shortlist funnels, and custom exportable reports.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
            ),
            color: "text-rose-600", bg: "bg-rose-50", accent: "from-rose-500 to-pink-600",
        },
        {
            title: "Multi-College Portal",
            desc: "Centralised console for managing drives across dozens or hundreds of colleges. Each college gets its own branded portal with unique registration links.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                </svg>
            ),
            color: "text-slate-600", bg: "bg-slate-100", accent: "from-slate-500 to-slate-700",
        },
    ];

    return (
        <section ref={ref} className="py-24 sm:py-32 bg-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Platform Features</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Everything you need for{" "}
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">campus recruitment</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
                        From student registration to final offers — run massive campus drives across multiple colleges on a single, intelligent platform.
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((f, i) => (
                        <div
                            key={f.title}
                            className="group relative rounded-3xl border border-slate-100 bg-white p-8 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300"
                            style={{ animationDelay: `${i * 60}ms`, animation: "fadeInUp 0.5s ease-out forwards", opacity: 0 }}
                        >
                            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${f.bg}`}>
                                <div className={f.color}>{f.icon}</div>
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-slate-900">{f.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                            <div className={`absolute bottom-0 left-8 right-8 h-0.5 rounded-full bg-gradient-to-r ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </div>
                    ))}
                </div>

                <style>{`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(16px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        </section>
    );
}

/* ─── How It Works ─────────────────────────────────────────────────────── */
function HowItWorks() {
    const ref = useFadeIn();
    const steps = [
        { num: "01", title: "Register & Schedule", desc: "Colleges register on the platform, share student rosters via Excel/CSV or self-registration links, and schedule drive dates and rounds.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
        { num: "02", title: "Assess & Proctor", desc: "Run proctored coding, aptitude, and domain-specific exams at scale. Auto-grade, shortlist, and publish results — college-wise or drive-wide.", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
        { num: "03", title: "Interview & Offer", desc: "Conduct live/async video interviews, collaborate with hiring panels, extend bulk offers, track acceptances, and onboard graduating batches.", color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
    ];

    return (
        <section ref={ref} className="py-24 sm:py-32 bg-slate-50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">How It Works</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Three steps to smarter campus hiring
                    </h2>
                </div>
                <div className="mt-16 relative">
                    <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200" />
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {steps.map((step, idx) => (
                            <div key={step.num} className={`relative rounded-3xl border ${step.border} bg-white p-8`}>
                                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${step.bg} mb-4`}>
                                    <span className={`text-lg font-black ${step.color}`}>{step.num}</span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="hidden md:flex absolute -right-5 top-14 z-10 h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </div>
                                )}
                                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── Stats Bar ────────────────────────────────────────────────────────── */
function StatsBar() {
    const stats = [
        { value: "500+", label: "Colleges Connected" },
        { value: "50K+", label: "Students Assessed" },
        { value: "200+", label: "Companies Hiring" },
        { value: "95%", label: "Placement Rate" },
    ];
    return (
        <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700" />
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {stats.map(stat => (
                        <div key={stat.label} className="text-center">
                            <p className="text-4xl font-black text-white sm:text-5xl">{stat.value}</p>
                            <p className="mt-2 text-sm font-medium text-emerald-200">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── CTA Banner ───────────────────────────────────────────────────────── */
function CTABanner() {
    const ref = useFadeIn();
    return (
        <section ref={ref} className="py-24 sm:py-32 bg-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-8 py-16 text-center shadow-2xl sm:px-16 sm:py-24">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                    </div>

                    <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        Ready to transform your campus placements?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-emerald-100">
                        Register your college or book a demo to see how Nallas Connect powers campus recruitment at scale.
                    </p>
                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            to="/campus/contact"
                            className="rounded-2xl bg-white px-8 py-4 text-sm font-bold text-emerald-600 shadow-lg hover:bg-emerald-50 transition-all active:scale-95"
                        >
                            Register Your College
                        </Link>
                        <Link
                            to="/contact"
                            className="rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-all active:scale-95"
                        >
                            Book a Demo
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

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

export default function LateralPage() {
    return (
        <div className="pt-24">
            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-24 sm:py-32">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[128px]" />
                    <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/15 blur-[128px]" />
                </div>
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                        <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Lateral Hiring</span>
                    </div>

                    <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
                        Hire experienced talent{" "}
                        <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            faster & smarter
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
                        An end-to-end recruitment platform for experienced-hire roles — from sourcing and screening to assessments, interviews, and onboarding.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            to="/lateral/contact"
                            className="group inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 hover:shadow-indigo-500/40 transition-all active:scale-95"
                        >
                            Submit Your Profile
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
            title: "Smart ATS & Pipeline",
            desc: "Full Applicant Tracking System with resume parsing, job board syndication, candidate database, talent pool management, employee referrals, and a branded career site.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
            ),
            color: "text-indigo-600", bg: "bg-indigo-50", accent: "from-indigo-500 to-blue-600",
        },
        {
            title: "Coding Assessments",
            desc: "40+ language support with real-time code execution, plagiarism detection, auto-grading engine, and customisable coding challenges for every seniority level.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
            ),
            color: "text-blue-600", bg: "bg-blue-50", accent: "from-blue-500 to-cyan-600",
        },
        {
            title: "Functional Assessments",
            desc: "AI-generated question banks for MCQ, descriptive, and case-study-based assessments — covering domain skills, psychometric, and aptitude tests.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
            ),
            color: "text-violet-600", bg: "bg-violet-50", accent: "from-violet-500 to-purple-600",
        },
        {
            title: "Video Interview Suite",
            desc: "Live panel interviews and one-way async interviews with AI-powered identity verification, automatic transcription, and structured evaluation scorecards.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
            ),
            color: "text-pink-600", bg: "bg-pink-50", accent: "from-pink-500 to-rose-600",
        },
        {
            title: "AI Proctoring",
            desc: "Face recognition, impersonation alerts, secure browser lock-down, device lock-down, tab-switch detection, and AI-flagged incident reports.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
            ),
            color: "text-emerald-600", bg: "bg-emerald-50", accent: "from-emerald-500 to-teal-600",
        },
        {
            title: "Onboarding & BGV",
            desc: "Digital onboarding with offer letter management, e-signature capture, document collection, and integrated background verification workflows.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
                </svg>
            ),
            color: "text-amber-600", bg: "bg-amber-50", accent: "from-amber-500 to-orange-600",
        },
        {
            title: "Automation & Workflows",
            desc: "Define triggers, build rule-based pipelines, auto-schedule interviews, send templated communications, and create custom hiring stages.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            ),
            color: "text-cyan-600", bg: "bg-cyan-50", accent: "from-cyan-500 to-blue-600",
        },
        {
            title: "Analytics & Reporting",
            desc: "Hiring velocity dashboards, source effectiveness, diversity metrics, EEO compliance reports, and custom report builder with scheduled exports.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
            ),
            color: "text-rose-600", bg: "bg-rose-50", accent: "from-rose-500 to-pink-600",
        },
        {
            title: "Enterprise Integrations",
            desc: "Connect to HRMS, payroll, Slack, MS Teams, Google Workspace, job boards (Naukri, LinkedIn, Indeed), and custom webhooks via REST API.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
            ),
            color: "text-slate-600", bg: "bg-slate-100", accent: "from-slate-500 to-slate-700",
        },
    ];

    return (
        <section ref={ref} className="py-24 sm:py-32 bg-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Platform Features</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Everything you need for{" "}
                        <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">lateral recruitment</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
                        From sourcing to onboarding — one platform that replaces fragmented tools with one intelligent, configurable suite.
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
        { num: "01", title: "Post & Source", desc: "Create job requisitions, syndicate to job boards, manage employee referrals, and receive applications through your branded career site.", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
        { num: "02", title: "Screen & Assess", desc: "Auto-parse resumes, run AI-powered coding and functional assessments with proctoring, and shortlist top candidates automatically.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        { num: "03", title: "Interview & Hire", desc: "Schedule video interviews, collaborate with hiring panels, extend offers, run background verification, and complete digital onboarding.", color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
    ];

    return (
        <section ref={ref} className="py-24 sm:py-32 bg-slate-50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">How It Works</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Three steps to smarter lateral hiring
                    </h2>
                </div>
                <div className="mt-16 relative">
                    <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-indigo-200 via-blue-200 to-cyan-200" />
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

/* ─── CTA Banner ───────────────────────────────────────────────────────── */
function CTABanner() {
    const ref = useFadeIn();
    return (
        <section ref={ref} className="py-24 sm:py-32 bg-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 px-8 py-16 text-center shadow-2xl sm:px-16 sm:py-24">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                    </div>

                    <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        Ready to hire experienced talent faster?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
                        Submit your profile or book a demo to see how GradLogic transforms lateral recruitment.
                    </p>
                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            to="/lateral/contact"
                            className="rounded-2xl bg-white px-8 py-4 text-sm font-bold text-indigo-600 shadow-lg hover:bg-indigo-50 transition-all active:scale-95"
                        >
                            Submit Your Profile
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

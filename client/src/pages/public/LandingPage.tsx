import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* ─── Animated counter hook ─────────────────────────────────────────────── */
function useCountUp(end: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const precision = Number.isInteger(end) ? 0 : 1;
        let animationFrame: number | null = null;
        let startTime: number | null = null;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || hasAnimated.current) return;

                hasAnimated.current = true;
                const animate = (timestamp: number) => {
                    if (startTime === null) startTime = timestamp;
                    const progress = Math.min((timestamp - startTime) / duration, 1);
                    const nextValue = end * progress;
                    setCount(Number(nextValue.toFixed(precision)));

                    if (progress < 1) {
                        animationFrame = window.requestAnimationFrame(animate);
                    }
                };

                animationFrame = window.requestAnimationFrame(animate);
                observer.disconnect();
            },
            { threshold: 0.3 }
        );
        observer.observe(el);

        return () => {
            observer.disconnect();
            if (animationFrame !== null) {
                window.cancelAnimationFrame(animationFrame);
            }
        };
    }, [end, duration]);

    return { count, ref };
}

/* ─── Fade-in on scroll hook ────────────────────────────────────────────── */
function useFadeIn() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.opacity = "0";
        el.style.transform = "translateY(32px)";
        el.style.transition = "opacity 0.7s ease, transform 0.7s ease";
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.style.opacity = "1";
                    el.style.transform = "translateY(0)";
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return ref;
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
    return (
        <>
            <HeroSection />
            <TrustedBySection />
            <FeaturesSection />
            <HowItWorksSection />
            <StatsSection />
            <TestimonialsSection />
            <CTASection />
        </>
    );
}

/* ─── Hero ──────────────────────────────────────────────────────────────── */
function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[128px] hero-orb-1" />
                <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[128px] hero-orb-2" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[96px] hero-orb-3" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white/[0.03] hero-particle"
                        style={{
                            width: `${8 + i * 4}px`,
                            height: `${8 + i * 4}px`,
                            left: `${15 + i * 14}%`,
                            top: `${20 + (i % 3) * 25}%`,
                            animationDelay: `${i * 1.2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />

            <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 text-center lg:px-8">
                {/* Badge */}
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm hero-badge-shimmer overflow-hidden relative">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">AI-Powered Hiring &amp; ATS Platform</span>
                </div>

                {/* Headline */}
                <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
                    Hire smarter —{" "}
                    <span className="hero-gradient-text">
                        lateral &amp; campus
                    </span>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl hero-subtitle">
                    One intelligent platform for lateral recruitment and campus hiring — AI-powered assessments, applicant tracking, video interviews, proctoring, and onboarding.
                </p>

                {/* CTA Buttons — contextual (Sign In & Book a Demo are in the navbar) */}
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Link
                        to="/lateral"
                        className="group relative inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300 active:scale-95"
                    >
                        Explore Lateral Hiring
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                    <Link
                        to="/campus"
                        className="group inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/30 hover:scale-105 transition-all duration-300 active:scale-95"
                    >
                        Explore Campus Hiring
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </div>

                {/* Dashboard preview mockup */}
                <div className="mt-20 mx-auto max-w-5xl">
                    <div className="relative rounded-2xl p-[1px] hero-mockup-border shadow-2xl shadow-indigo-500/10">
                        <div className="rounded-2xl bg-slate-900/80 backdrop-blur-xl p-2">
                            <div className="rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-4 sm:p-6">
                                {/* Mock browser chrome */}
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="h-3 w-3 rounded-full bg-red-400/60" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                                    <div className="h-3 w-3 rounded-full bg-green-400/60" />
                                    <div className="ml-4 h-6 flex-1 rounded-md bg-white/5 flex items-center px-3">
                                        <span className="text-[10px] text-slate-500 font-mono">app.nallasconnect.com/dashboard</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                    {/* Left sidebar */}
                                    <div className="sm:col-span-3 space-y-3 hidden sm:block">
                                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pipeline</p>
                                            {[
                                                { label: "Applied", count: "1,247", color: "bg-blue-500" },
                                                { label: "Screened", count: "823", color: "bg-indigo-500" },
                                                { label: "Assessed", count: "412", color: "bg-violet-500" },
                                                { label: "Interview", count: "186", color: "bg-purple-500" },
                                                { label: "Offered", count: "64", color: "bg-emerald-500" },
                                            ].map(s => (
                                                <div key={s.label} className="flex items-center justify-between py-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                                                        <span className="text-[10px] text-slate-400">{s.label}</span>
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-slate-300">{s.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="rounded-lg bg-gradient-to-br from-indigo-600/20 to-blue-600/10 border border-indigo-500/20 p-3">
                                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1">AI Score</p>
                                            <p className="text-2xl font-black text-white">87<span className="text-sm text-indigo-300">/100</span></p>
                                            <p className="text-[9px] text-indigo-400 mt-1">Avg. candidate quality</p>
                                        </div>
                                    </div>

                                    {/* Main content */}
                                    <div className="sm:col-span-9 space-y-4">
                                        {/* Top metrics row */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {[
                                                { label: "Time to Hire", value: "18d", change: "↓ 12%", changeColor: "text-emerald-400" },
                                                { label: "Assessments", value: "2,341", change: "↑ 24%", changeColor: "text-emerald-400" },
                                                { label: "Offer Rate", value: "68%", change: "↑ 8%", changeColor: "text-emerald-400" },
                                                { label: "Active Jobs", value: "47", change: "3 new", changeColor: "text-blue-400" },
                                            ].map(m => (
                                                <div key={m.label} className="rounded-lg bg-white/5 border border-white/10 p-3">
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</p>
                                                    <p className="text-xl font-black text-white mt-1">{m.value}</p>
                                                    <p className={`text-[9px] font-semibold ${m.changeColor} mt-0.5`}>{m.change}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Chart + candidates */}
                                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                            {/* Mini bar chart */}
                                            <div className="sm:col-span-3 rounded-lg bg-white/5 border border-white/10 p-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Hiring Funnel — This Week</p>
                                                <div className="flex items-end gap-2 h-20">
                                                    {[65, 80, 45, 90, 55, 70, 85].map((h, i) => (
                                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                            <div
                                                                className="w-full rounded-sm bg-gradient-to-t from-indigo-600 to-blue-500 opacity-80"
                                                                style={{ height: `${h}%` }}
                                                            />
                                                            <span className="text-[8px] text-slate-500">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Recent candidates */}
                                            <div className="sm:col-span-2 rounded-lg bg-white/5 border border-white/10 p-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Candidates</p>
                                                {[
                                                    { name: "Priya S.", role: "SDE II", status: "Assessed", statusColor: "bg-violet-500" },
                                                    { name: "Rahul M.", role: "Data Eng.", status: "Interview", statusColor: "bg-purple-500" },
                                                    { name: "Aisha K.", role: "Full Stack", status: "Offered", statusColor: "bg-emerald-500" },
                                                ].map(c => (
                                                    <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                                                        <div>
                                                            <p className="text-[10px] font-semibold text-slate-300">{c.name}</p>
                                                            <p className="text-[8px] text-slate-500">{c.role}</p>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-semibold text-white ${c.statusColor}`}>
                                                            {c.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Upcoming interviews */}
                                        <div className="rounded-lg bg-white/5 border border-white/10 p-3 hidden sm:block">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Upcoming Interviews</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { time: "10:00 AM", candidate: "Vikram T.", type: "Technical", color: "border-l-blue-500" },
                                                    { time: "11:30 AM", candidate: "Neha R.", type: "HR Round", color: "border-l-emerald-500" },
                                                    { time: "2:00 PM", candidate: "Arjun P.", type: "System Design", color: "border-l-amber-500" },
                                                ].map(iv => (
                                                    <div key={iv.candidate} className={`rounded-md bg-white/5 border-l-2 ${iv.color} px-3 py-2`}>
                                                        <p className="text-[9px] font-bold text-slate-300">{iv.time}</p>
                                                        <p className="text-[9px] text-slate-400">{iv.candidate}</p>
                                                        <p className="text-[8px] text-indigo-400">{iv.type}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Glow beneath */}
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 h-40 w-4/5 rounded-full bg-gradient-to-r from-indigo-600/20 via-blue-500/25 to-cyan-500/20 blur-[100px]" />
                </div>
            </div>

            {/* Hero animations CSS */}
            <style>{`
                .hero-orb-1 { animation: heroFloat1 12s ease-in-out infinite; }
                .hero-orb-2 { animation: heroFloat2 15s ease-in-out infinite; }
                .hero-orb-3 { animation: heroFloat3 10s ease-in-out infinite; }
                @keyframes heroFloat1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,-40px); } }
                @keyframes heroFloat2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-40px,30px); } }
                @keyframes heroFloat3 { 0%,100% { transform: translate(-50%,-50%); } 50% { transform: translate(calc(-50% + 20px),calc(-50% - 20px)); } }

                .hero-particle { animation: particleDrift 8s ease-in-out infinite; }
                @keyframes particleDrift {
                    0%,100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                    25% { transform: translateY(-30px) translateX(10px); opacity: 0.6; }
                    50% { transform: translateY(-60px) translateX(-10px); opacity: 0.3; }
                    75% { transform: translateY(-30px) translateX(15px); opacity: 0.5; }
                }

                .hero-badge-shimmer::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%);
                    background-size: 200% 100%;
                    animation: shimmerSweep 3s ease-in-out infinite;
                    border-radius: inherit;
                }
                @keyframes shimmerSweep { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

                .hero-gradient-text {
                    background-image: linear-gradient(90deg, #818cf8, #60a5fa, #22d3ee, #818cf8);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: gradientShift 4s ease-in-out infinite;
                }
                @keyframes gradientShift { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }

                .hero-subtitle { animation: heroFadeIn 1s ease-out 0.3s both; }
                @keyframes heroFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

                .hero-mockup-border {
                    background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(59,130,246,0.1), rgba(99,102,241,0.3));
                    background-size: 300% 300%;
                    animation: borderGlow 6s ease-in-out infinite;
                }
                @keyframes borderGlow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
            `}</style>
        </section>
    );
}

/* ─── Trusted By ────────────────────────────────────────────────────────── */
function TrustedBySection() {
    const ref = useFadeIn();
    const logos = [
        { name: "TCS", style: "text-lg font-black tracking-tight" },
        { name: "Infosys", style: "text-base font-bold italic" },
        { name: "Wipro", style: "text-lg font-extrabold" },
        { name: "HCL", style: "text-lg font-black tracking-widest" },
        { name: "IIT Bombay", style: "text-sm font-bold tracking-wide" },
        { name: "NIT Trichy", style: "text-sm font-bold" },
        { name: "BITS Pilani", style: "text-sm font-extrabold tracking-tight" },
        { name: "VIT", style: "text-lg font-black" },
        { name: "SRM", style: "text-base font-extrabold tracking-widest" },
        { name: "Anna University", style: "text-sm font-bold" },
    ];

    return (
        <section ref={ref} className="border-b border-slate-100 bg-slate-50/50 py-14 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Trusted by leading companies & institutions</p>
                {/* Infinite marquee */}
                <div className="relative mt-8">
                    {/* Edge gradient masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50/90 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50/90 to-transparent z-10 pointer-events-none" />
                    <div className="marquee-track flex items-center gap-12">
                        {[...logos, ...logos].map((logo, i) => (
                            <span
                                key={`${logo.name}-${i}`}
                                className={`${logo.style} text-slate-300/70 hover:text-indigo-500 transition-colors duration-300 cursor-default select-none whitespace-nowrap flex-shrink-0`}
                            >
                                {logo.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <style>{`
                .marquee-track {
                    animation: marqueeScroll 25s linear infinite;
                    width: max-content;
                }
                .marquee-track:hover { animation-play-state: paused; }
                @keyframes marqueeScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    );
}

/* ─── Features ──────────────────────────────────────────────────────────── */
function FeaturesSection() {
    const ref = useFadeIn();
    const [activeTab, setActiveTab] = useState<"lateral" | "campus">("lateral");

    const lateralFeatures = [
        {
            title: "Smart ATS & Pipeline",
            desc: "Full Applicant Tracking System with resume parsing, job board syndication, candidate database, talent pool management, employee referrals, and a branded career site.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
            ),
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            accent: "from-indigo-500 to-blue-600",
        },
        {
            title: "Coding Assessments",
            desc: "Full-stack coding challenges across 40+ languages with auto-evaluation, plagiarism detection, sandboxed execution environments, and real-time leaderboards.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
            ),
            color: "text-blue-600",
            bg: "bg-blue-50",
            accent: "from-blue-500 to-cyan-600",
        },
        {
            title: "Functional Assessments",
            desc: "Assess candidates on cognitive, behavioural, soft skills, domain expertise, and aptitude with AI-generated and curated question banks — MCQ, case-study, and simulation formats.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
            ),
            color: "text-amber-600",
            bg: "bg-amber-50",
            accent: "from-amber-500 to-orange-600",
        },
        {
            title: "Video Interview Suite",
            desc: "Live and one-way video interviews with AI identity verification, interview templates, recruiter collaboration, candidate rating, and detailed post-interview analytics.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
            ),
            color: "text-rose-600",
            bg: "bg-rose-50",
            accent: "from-rose-500 to-pink-600",
        },
        {
            title: "AI Proctoring",
            desc: "Automated online proctoring with face recognition, tab-switch detection, impersonation alerts, secure browser lock-down, and timestamped proctoring logs.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
            ),
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            accent: "from-emerald-500 to-teal-600",
        },
        {
            title: "Onboarding & BGV",
            desc: "Seamless digital onboarding with offer letter management, document collection, e-signatures, background verification, and joining-day workflows.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                </svg>
            ),
            color: "text-sky-600",
            bg: "bg-sky-50",
            accent: "from-sky-500 to-blue-600",
        },
        {
            title: "Automation & Workflows",
            desc: "Configurable hiring workflows with automated email triggers, interview scheduling, status updates, rejection handling, and multi-stakeholder approvals.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.256c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            ),
            color: "text-violet-600",
            bg: "bg-violet-50",
            accent: "from-violet-500 to-purple-600",
        },
        {
            title: "Analytics & Reporting",
            desc: "Rich dashboards for hiring funnel metrics, recruiter performance, time-to-hire tracking, source analytics, diversity insights, and compliance reports.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
            ),
            color: "text-cyan-600",
            bg: "bg-cyan-50",
            accent: "from-cyan-500 to-teal-600",
        },
        {
            title: "Enterprise Integrations",
            desc: "Connectors to LinkedIn, Naukri, HRIS, SSO/LDAP, background verification partners, e-signature providers, and REST API access with webhooks.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
            ),
            color: "text-fuchsia-600",
            bg: "bg-fuchsia-50",
            accent: "from-fuchsia-500 to-pink-600",
        },
    ];

    const campusFeatures = [
        {
            title: "Campus Drive Management",
            desc: "End-to-end campus recruitment with college shortlisting, drive scheduling, multi-campus coordination, slot management, and real-time drive dashboards.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
            ),
            color: "text-purple-600",
            bg: "bg-purple-50",
            accent: "from-purple-500 to-violet-600",
        },
        {
            title: "Placement ERP",
            desc: "Comprehensive placement office automation — student registration, eligibility management, company profiles, offer tracking, placement reports, and TPO dashboards.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                </svg>
            ),
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            accent: "from-indigo-500 to-blue-600",
        },
        {
            title: "Bulk Candidate Import",
            desc: "Import thousands of students via Excel/CSV with automatic de-duplication, eligibility validation, CGPA filtering, and branch/department segmentation.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
            ),
            color: "text-teal-600",
            bg: "bg-teal-50",
            accent: "from-teal-500 to-emerald-600",
        },
        {
            title: "Coding Lab & Practice",
            desc: "Cloud-based coding environment for students with practice problems, AI-powered hints, multi-language support, auto-grading, and plagiarism detection.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
            ),
            color: "text-blue-600",
            bg: "bg-blue-50",
            accent: "from-blue-500 to-cyan-600",
        },
        {
            title: "Online Exam Platform",
            desc: "Scalable online examination with 100K+ concurrent test-takers, randomised question pools, section-wise timing, and instant result generation.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
            ),
            color: "text-amber-600",
            bg: "bg-amber-50",
            accent: "from-amber-500 to-orange-600",
        },
        {
            title: "AI Proctoring",
            desc: "Enterprise-grade proctoring with face recognition, impersonation alerts, secure browser, device lock-down, and AI-flagged incident reports for every candidate.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
            ),
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            accent: "from-emerald-500 to-teal-600",
        },
        {
            title: "Video Interviews",
            desc: "Live panel interviews and async video assessments with recording, AI evaluation, interviewer panels, and integrated feedback for campus shortlisting rounds.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
            ),
            color: "text-rose-600",
            bg: "bg-rose-50",
            accent: "from-rose-500 to-pink-600",
        },
        {
            title: "Student Employability",
            desc: "Readiness assessments, aptitude tests, mock interviews, AI-powered feedback, and skill-gap analysis to improve student placement rates before drives begin.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
            ),
            color: "text-sky-600",
            bg: "bg-sky-50",
            accent: "from-sky-500 to-blue-600",
        },
        {
            title: "Reporting & Compliance",
            desc: "AICTE/UGC-ready placement reports, college-wise analytics, company participation metrics, offer-to-join ratios, and exportable compliance reports.",
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
            ),
            color: "text-cyan-600",
            bg: "bg-cyan-50",
            accent: "from-cyan-500 to-teal-600",
        },
    ];

    const features = activeTab === "lateral" ? lateralFeatures : campusFeatures;

    const tabs = [
        {
            key: "lateral" as const,
            label: "Lateral Hiring",
            subtitle: "For experienced-hire recruitment",
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
            ),
        },
        {
            key: "campus" as const,
            label: "Campus Hiring",
            subtitle: "For college & university recruitment",
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
            ),
        },
    ];

    return (
        <section id="features" ref={ref} className="scroll-mt-28 py-24 sm:py-32 bg-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Platform Features</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        One platform, two powerful <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">hiring engines</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
                        Whether you're hiring experienced professionals or recruiting from campuses — Nallas Connect has purpose-built tools for both.
                    </p>
                </div>

                {/* ── Tab Switcher ─────────────────────────────────────────── */}
                <div className="mt-12 flex justify-center">
                    <div role="tablist" aria-label="Hiring type" className="inline-flex rounded-2xl bg-slate-100 p-1.5 gap-1.5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                id={`tab-${tab.key}`}
                                aria-selected={activeTab === tab.key}
                                aria-controls={`panel-${tab.key}`}
                                onClick={() => setActiveTab(tab.key)}
                                className={`relative flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 ${activeTab === tab.key
                                    ? "bg-white text-slate-900 shadow-lg shadow-slate-200/50"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                <span className={`transition-colors ${activeTab === tab.key ? "text-indigo-600" : "text-slate-400"}`}>
                                    {tab.icon}
                                </span>
                                <span className="hidden sm:block">
                                    <span className="block">{tab.label}</span>
                                    <span className={`block text-xs font-normal ${activeTab === tab.key ? "text-slate-500" : "text-slate-400"}`}>{tab.subtitle}</span>
                                </span>
                                <span className="sm:hidden">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Feature Grid ────────────────────────────────────────── */}
                <div
                    key={activeTab}
                    id={`panel-${activeTab}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${activeTab}`}
                    className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
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

/* ─── How It Works ──────────────────────────────────────────────────────── */
function HowItWorksSection() {
    const ref = useFadeIn();
    const steps = [
        {
            num: "01",
            title: "Post & Attract",
            desc: "Create jobs for lateral roles or campus drives. Post to job boards, manage referrals, and let candidates apply through your branded career site.",
            color: "text-indigo-600",
            border: "border-indigo-200",
            bg: "bg-indigo-50",
        },
        {
            num: "02",
            title: "Screen & Assess",
            desc: "Auto-parse resumes, run AI-powered skill assessments, conduct proctored exams, and shortlist candidates — for lateral hires or campus batches.",
            color: "text-blue-600",
            border: "border-blue-200",
            bg: "bg-blue-50",
        },
        {
            num: "03",
            title: "Interview & Hire",
            desc: "Schedule video interviews, collaborate with hiring panels, extend offers, run background checks, and onboard — all from one platform.",
            color: "text-cyan-600",
            border: "border-cyan-200",
            bg: "bg-cyan-50",
        },
    ];

    return (
        <section id="how-it-works" ref={ref} className="scroll-mt-28 py-24 sm:py-32 bg-slate-50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">How It Works</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Three steps to smarter hiring
                    </h2>
                </div>

                <div className="mt-16 relative">
                    {/* Connecting line (desktop) */}
                    <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-indigo-200 via-blue-200 to-cyan-200" />

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {steps.map((step, idx) => (
                            <div key={step.num} className={`relative rounded-3xl border ${step.border} bg-white p-8`}>
                                {/* Step number circle */}
                                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${step.bg} mb-4`}>
                                    <span className={`text-lg font-black ${step.color}`}>{step.num}</span>
                                </div>
                                {/* Arrow between cards (desktop only) */}
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

/* ─── Stats ─────────────────────────────────────────────────────────────── */
function StatsSection() {
    const stats = [
        { value: 500, suffix: "+", label: "Companies Hiring" },
        { value: 50, suffix: "K+", label: "Candidates Assessed" },
        { value: 50, suffix: "+", label: "Partner Campuses" },
        { value: 99.9, suffix: "%", label: "Platform Uptime" },
    ];

    return (
        <section className="relative py-24 sm:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700" />
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {stats.map((stat) => (
                        <StatCounter key={stat.label} {...stat} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
    const { count, ref } = useCountUp(value);

    return (
        <div ref={ref} className="text-center rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/10 py-8 px-4 hover:bg-white/[0.12] transition-all duration-300">
            <p className="text-4xl font-black text-white sm:text-5xl">
                {count}{suffix}
            </p>
            <p className="mt-2 text-sm font-medium text-indigo-200">{label}</p>
        </div>
    );
}

/* ─── Testimonials ──────────────────────────────────────────────────────── */
function TestimonialsSection() {
    const ref = useFadeIn();
    const testimonials = [
        {
            quote: "Nallas Connect cut our lateral hiring cycle from 45 days to under 2 weeks. The ATS and automated screening are game-changers.",
            name: "Rajesh Kumar",
            role: "VP — Talent Acquisition, Leading IT Services",
            avatar: "RK",
        },
        {
            quote: "We ran our entire campus drive — 3,000 students across 12 colleges — on a single platform. Proctoring, assessments, offers, all done.",
            name: "Meena Subramanian",
            role: "Head of Campus Hiring, Fortune 500 Conglomerate",
            avatar: "MS",
        },
        {
            quote: "The integrated video interviews and AI proctoring gave us confidence in remote hiring. We've seen 95% reduction in assessment fraud.",
            name: "Dr. Anand Sharma",
            role: "Training & Placement Officer, Top Engineering University",
            avatar: "AS",
        },
    ];

    return (
        <section ref={ref} className="py-24 sm:py-32 bg-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Testimonials</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Loved by campuses and recruiters
                    </h2>
                </div>

                <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                    {testimonials.map((t) => (
                        <div key={t.name} className="relative rounded-3xl border border-slate-100 bg-slate-50/50 p-8 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 group">
                            {/* Decorative quote mark */}
                            <span className="absolute top-4 right-6 text-6xl font-serif text-indigo-100/60 leading-none select-none pointer-events-none">&ldquo;</span>
                            {/* Stars */}
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <svg key={s} className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                                    </svg>
                                ))}
                            </div>
                            <blockquote className="mt-4 text-sm leading-relaxed text-slate-600 relative z-10">&ldquo;{t.quote}&rdquo;</blockquote>
                            <div className="mt-6 flex items-center gap-3">
                                {/* Gradient ring avatar */}
                                <div className="relative p-[2px] rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-indigo-600">
                                        {t.avatar}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                                    <p className="text-xs text-slate-400">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── CTA Banner ────────────────────────────────────────────────────────── */
function CTASection() {
    const ref = useFadeIn();
    return (
        <section ref={ref} className="py-24 sm:py-32 bg-slate-50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 px-8 py-16 text-center shadow-2xl sm:px-16 sm:py-24">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                    </div>
                    {/* Sparkle dots */}
                    <div className="absolute inset-0 -z-[5] overflow-hidden pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute h-1 w-1 rounded-full bg-white/30 cta-sparkle"
                                style={{
                                    left: `${10 + i * 12}%`,
                                    top: `${15 + (i % 3) * 30}%`,
                                    animationDelay: `${i * 0.6}s`,
                                }}
                            />
                        ))}
                    </div>

                    <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        Ready to transform your hiring?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
                        Join 500+ companies and 50+ campuses already using Nallas Connect for lateral and campus recruitment.
                    </p>
                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            to="/contact"
                            className="rounded-2xl bg-white px-8 py-4 text-sm font-bold text-indigo-600 shadow-lg hover:bg-indigo-50 hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/pricing"
                            className="rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 hover:scale-105 transition-all duration-300 active:scale-95"
                        >
                            View Pricing
                        </Link>
                    </div>
                </div>
            </div>
            <style>{`
                .cta-sparkle {
                    animation: sparkleFloat 4s ease-in-out infinite;
                }
                @keyframes sparkleFloat {
                    0%,100% { transform: scale(1) translateY(0); opacity: 0.2; }
                    50% { transform: scale(2) translateY(-12px); opacity: 0.7; }
                }
            `}</style>
        </section>
    );
}

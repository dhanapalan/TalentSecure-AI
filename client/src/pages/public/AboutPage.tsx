import { Link } from "react-router-dom";

const VALUES = [
    {
        title: "Innovation First",
        desc: "We leverage cutting-edge AI to solve real recruitment challenges, not just automate the old ones.",
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
        ),
    },
    {
        title: "Hiring-Centric",
        desc: "Built for how companies actually hire — whether it's lateral roles or campus drives, one platform handles it all.",
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
        ),
    },
    {
        title: "Trust & Integrity",
        desc: "Every assessment is proctored, every result is verifiable, and every data point is protected.",
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
        ),
    },
];


export default function AboutPage() {
    return (
        <div className="pt-24">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 py-24 sm:py-32">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-[128px]" />
                    <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-blue-500/15 blur-[96px]" />
                </div>
                <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">About Us</p>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                        Building the future of <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">intelligent hiring</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                        We started Nallas Connect with a simple belief: every company deserves access to the best talent, and every candidate deserves a fair shot — whether they're an experienced professional or a fresh graduate.
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="py-24 sm:py-32 bg-white">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Our Mission</p>
                            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                                Make every hire count — lateral or campus
                            </h2>
                            <p className="mt-6 text-base leading-relaxed text-slate-500">
                                Hiring is fragmented. Lateral recruiters juggle multiple tools for sourcing, screening, and interviewing. Campus teams still rely on spreadsheets and manual processes for drives across dozens of colleges.
                            </p>
                            <p className="mt-4 text-base leading-relaxed text-slate-500">
                                We're changing that. One intelligent platform handles the entire hiring lifecycle — from job posting and applicant tracking to AI assessments, video interviews, proctoring, and onboarding — for both lateral and campus hiring.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { val: "500+", label: "Companies Hiring" },
                                { val: "50+", label: "Partner Campuses" },
                                { val: "50K+", label: "Candidates Assessed" },
                                { val: "2024", label: "Founded" },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
                                    <p className="text-2xl font-black text-indigo-600">{stat.val}</p>
                                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 sm:py-32 bg-slate-50">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Our Values</p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">What drives us every day</h2>
                    </div>
                    <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                        {VALUES.map((v) => (
                            <div key={v.title} className="rounded-3xl border border-slate-200 bg-white p-8">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    {v.icon}
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-slate-900">{v.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-500">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>




            {/* CTA */}
            <section className="py-20 bg-slate-50">
                <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
                    <h2 className="text-2xl font-extrabold text-slate-900">Want to join our journey?</h2>
                    <p className="mt-3 text-base text-slate-500">We're always looking for passionate people to join our team.</p>
                    <Link
                        to="/contact"
                        className="mt-8 inline-block rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        Get in Touch
                    </Link>
                </div>
            </section>
        </div>
    );
}

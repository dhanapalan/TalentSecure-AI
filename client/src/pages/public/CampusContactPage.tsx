import { useState } from "react";
import { Link } from "react-router-dom";

export default function CampusContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";
    const labelClass = "block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2";

    return (
        <div className="pt-24">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-1/4 h-72 w-72 rounded-full bg-emerald-200 blur-[100px]" />
                    <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal-200 blur-[80px]" />
                </div>
                <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5">
                        <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                        </svg>
                        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Campus Hiring</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Register your college
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
                        Connect your institution with top companies. Share your college details and we'll set up campus drives for your students.
                    </p>
                </div>
            </section>

            {/* Form */}
            <section className="pb-24 sm:pb-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-5">
                        {/* Form area */}
                        <div className="lg:col-span-3">
                            {submitted ? (
                                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-12 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                                        <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    </div>
                                    <h3 className="mt-6 text-xl font-bold text-slate-900">Registration received!</h3>
                                    <p className="mt-2 text-sm text-slate-500">Our campus team will reach out within 48 hours to set up your college on the platform.</p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="mt-6 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                                    >
                                        Register another college →
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* College Info */}
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                                            </svg>
                                            College Information
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className={labelClass}>College Name *</label>
                                                    <input required name="collegeName" placeholder="Anna University" className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>University Affiliation</label>
                                                    <input name="university" placeholder="Anna University / Autonomous" className={inputClass} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className={labelClass}>City *</label>
                                                    <input required name="city" placeholder="Chennai" className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>State *</label>
                                                    <select required name="state" className={inputClass}>
                                                        <option value="">Select state</option>
                                                        <option value="AP">Andhra Pradesh</option>
                                                        <option value="KA">Karnataka</option>
                                                        <option value="KL">Kerala</option>
                                                        <option value="MH">Maharashtra</option>
                                                        <option value="TN">Tamil Nadu</option>
                                                        <option value="TS">Telangana</option>
                                                        <option value="DL">Delhi</option>
                                                        <option value="UP">Uttar Pradesh</option>
                                                        <option value="WB">West Bengal</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Person */}
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                            Contact Person (TPO / Placement Officer)
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className={labelClass}>Full Name *</label>
                                                    <input required name="contactName" placeholder="Dr. Anand Sharma" className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Designation</label>
                                                    <input name="designation" placeholder="Training & Placement Officer" className={inputClass} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className={labelClass}>Email Address *</label>
                                                    <input required type="email" name="email" placeholder="tpo@college.edu" className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Phone Number *</label>
                                                    <input required type="tel" name="phone" placeholder="+91 98765 43210" className={inputClass} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Academic Details */}
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                            </svg>
                                            Academic Details
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className={labelClass}>Eligible Students (approx.) *</label>
                                                    <select required name="studentCount" className={inputClass}>
                                                        <option value="">Select range</option>
                                                        <option value="<100">Less than 100</option>
                                                        <option value="100-300">100 – 300</option>
                                                        <option value="300-500">300 – 500</option>
                                                        <option value="500-1000">500 – 1,000</option>
                                                        <option value="1000-3000">1,000 – 3,000</option>
                                                        <option value="3000+">3,000+</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Placement Season</label>
                                                    <input name="season" type="month" className={inputClass} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Departments / Branches</label>
                                                <input name="departments" placeholder="CSE, ECE, Mechanical, Civil, MBA…" className={inputClass} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className={labelClass}>Additional Information</label>
                                        <textarea
                                            name="message"
                                            rows={4}
                                            placeholder="Tell us about your placement process, past placement stats, or any specific requirements…"
                                            className={`${inputClass} resize-none`}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full rounded-xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-emerald-600/40 transition-all active:scale-[0.98]"
                                    >
                                        Register Your College
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8">
                                <h3 className="text-base font-bold text-slate-900">Why register on Nallas Connect?</h3>
                                <ul className="mt-4 space-y-3">
                                    {[
                                        "Access to 200+ hiring companies on the platform",
                                        "Digital placement portal for your college",
                                        "AI-proctored assessments with zero infrastructure",
                                        "Real-time tracking of drives and student progress",
                                        "Automated offer letters and onboarding",
                                        "100% free for educational institutions",
                                    ].map(item => (
                                        <li key={item} className="flex items-start gap-3">
                                            <svg className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                            <span className="text-sm text-slate-600">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8">
                                <h3 className="text-base font-bold text-slate-900">Campus team contact</h3>
                                <ul className="mt-4 space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Email</p>
                                            <a href="mailto:campus@nallasconnect.com" className="text-sm text-emerald-600 hover:underline">campus@nallasconnect.com</a>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Phone</p>
                                            <a href="tel:+919876543211" className="text-sm text-slate-500">+91 98765 43211</a>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8">
                                <h3 className="text-base font-bold text-slate-900">Are you an employer?</h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Looking to run campus drives? Book a demo to see our campus recruitment suite.
                                </p>
                                <Link
                                    to="/contact"
                                    className="mt-4 block w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                    Book a Demo →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

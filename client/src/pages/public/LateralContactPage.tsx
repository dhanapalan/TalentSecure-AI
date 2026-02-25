import { useState } from "react";
import { Link } from "react-router-dom";

export default function LateralContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");

    const handleAddSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !skills.includes(trimmed) && skills.length < 15) {
            setSkills([...skills, trimmed]);
            setSkillInput("");
        }
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow";
    const labelClass = "block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2";

    return (
        <div className="pt-24">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-1/4 h-72 w-72 rounded-full bg-indigo-200 blur-[100px]" />
                    <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-200 blur-[80px]" />
                </div>
                <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5">
                        <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Lateral Hiring</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Submit your profile
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
                        Share your resume, skills, and experience — and get discovered by top companies hiring on Nallas Connect.
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
                                    <h3 className="mt-6 text-xl font-bold text-slate-900">Profile submitted!</h3>
                                    <p className="mt-2 text-sm text-slate-500">We'll review your profile and connect you with matching opportunities.</p>
                                    <button
                                        onClick={() => { setSubmitted(false); setSkills([]); }}
                                        className="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                    >
                                        Submit another profile →
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label className={labelClass}>Full Name *</label>
                                            <input required name="name" placeholder="Priya Sharma" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Email Address *</label>
                                            <input required type="email" name="email" placeholder="priya@email.com" className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label className={labelClass}>Phone Number</label>
                                            <input type="tel" name="phone" placeholder="+91 98765 43210" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Current Company</label>
                                            <input name="company" placeholder="Infosys, TCS, Startup…" className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label className={labelClass}>Total Experience *</label>
                                            <select required name="experience" className={inputClass}>
                                                <option value="">Select experience</option>
                                                <option value="0-1">0 – 1 year</option>
                                                <option value="1-3">1 – 3 years</option>
                                                <option value="3-5">3 – 5 years</option>
                                                <option value="5-8">5 – 8 years</option>
                                                <option value="8-12">8 – 12 years</option>
                                                <option value="12+">12+ years</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Current Role</label>
                                            <input name="role" placeholder="Senior Software Engineer" className={inputClass} />
                                        </div>
                                    </div>

                                    {/* Skills / Expertise */}
                                    <div>
                                        <label className={labelClass}>Skills & Expertise *</label>
                                        <div className="rounded-xl border border-slate-200 bg-white p-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-shadow">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {skills.map(skill => (
                                                    <span key={skill} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                                        {skill}
                                                        <button type="button" onClick={() => removeSkill(skill)} className="ml-0.5 text-indigo-400 hover:text-indigo-600">
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                value={skillInput}
                                                onChange={e => setSkillInput(e.target.value)}
                                                onKeyDown={handleSkillKeyDown}
                                                onBlur={handleAddSkill}
                                                placeholder={skills.length === 0 ? "Type a skill and press Enter (e.g. React, Python, AWS…)" : "Add more…"}
                                                className="w-full border-0 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-400">Press Enter or comma to add. {skills.length}/15 skills.</p>
                                    </div>

                                    {/* Resume Upload */}
                                    <div>
                                        <label className={labelClass}>Upload Resume *</label>
                                        <div className="relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                                            <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                            </svg>
                                            <p className="mt-2 text-sm font-semibold text-slate-600">Drop your resume here or click to browse</p>
                                            <p className="mt-1 text-xs text-slate-400">PDF, DOC, DOCX — max 5MB</p>
                                            <input
                                                required
                                                type="file"
                                                name="resume"
                                                accept=".pdf,.doc,.docx"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* LinkedIn */}
                                    <div>
                                        <label className={labelClass}>LinkedIn Profile</label>
                                        <input name="linkedin" type="url" placeholder="https://linkedin.com/in/yourprofile" className={inputClass} />
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className={labelClass}>Additional Information</label>
                                        <textarea
                                            name="message"
                                            rows={4}
                                            placeholder="Anything else you'd like us to know — preferred locations, notice period, salary expectations…"
                                            className={`${inputClass} resize-none`}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-indigo-600/40 transition-all active:scale-[0.98]"
                                    >
                                        Submit Your Profile
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8">
                                <h3 className="text-base font-bold text-slate-900">Why submit your profile?</h3>
                                <ul className="mt-4 space-y-3">
                                    {[
                                        "Get matched with 500+ companies hiring on our platform",
                                        "AI-powered skill matching for relevant opportunities",
                                        "Direct access to hiring managers — no middlemen",
                                        "Track your application status in real-time",
                                        "100% free for candidates",
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
                                <h3 className="text-base font-bold text-slate-900">Contact us</h3>
                                <ul className="mt-4 space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Email</p>
                                            <a href="mailto:careers@nallasconnect.com" className="text-sm text-indigo-600 hover:underline">careers@nallasconnect.com</a>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Phone</p>
                                            <a href="tel:+919876543210" className="text-sm text-slate-500">+91 98765 43210</a>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-8">
                                <h3 className="text-base font-bold text-slate-900">Are you an employer?</h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Looking to hire experienced professionals? Book a demo to see our lateral hiring platform.
                                </p>
                                <Link
                                    to="/contact"
                                    className="mt-4 block w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-center text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
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

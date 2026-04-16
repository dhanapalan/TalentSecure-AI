import { useState } from "react";

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In production, this would call an API
        setSubmitted(true);
    };

    return (
        <div className="pt-24">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-20 sm:py-28">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-1/4 h-72 w-72 rounded-full bg-indigo-200 blur-[100px]" />
                    <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-200 blur-[80px]" />
                </div>
                <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Contact Us</p>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Let's talk about your hiring needs
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
                        Book a demo, ask a question, or just say hello. We'd love to hear from you.
                    </p>
                </div>
            </section>

            {/* Form + Info */}
            <section className="pb-24 sm:pb-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-5">
                        {/* Contact Form */}
                        <div className="lg:col-span-3">
                            {submitted ? (
                                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-12 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                                        <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    </div>
                                    <h3 className="mt-6 text-xl font-bold text-slate-900">Message sent!</h3>
                                    <p className="mt-2 text-sm text-slate-500">We'll get back to you within 24 hours.</p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                    >
                                        Send another message →
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Full Name</label>
                                            <input
                                                required
                                                name="name"
                                                placeholder="Dr. Rajesh Kumar"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
                                            <input
                                                required
                                                type="email"
                                                name="email"
                                                placeholder="rajesh@college.edu"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Organization</label>
                                        <input
                                            name="organization"
                                            placeholder="NIT Trichy"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">I am a…</label>
                                        <select
                                            name="role"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                                        >
                                            <option value="">Select your role</option>
                                            <option value="placement_officer">Placement Officer / TPO</option>
                                            <option value="hr_recruiter">HR / Recruiter</option>
                                            <option value="faculty">Faculty / HOD</option>
                                            <option value="student">Student</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Message</label>
                                        <textarea
                                            required
                                            name="message"
                                            rows={5}
                                            placeholder="Tell us about your requirements…"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-indigo-600/40 transition-all active:scale-[0.98]"
                                    >
                                        Send Message
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Contact Info */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8">
                                <h3 className="text-base font-bold text-slate-900">Get in touch</h3>
                                <ul className="mt-6 space-y-5">
                                    <li className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Email</p>
                                            <a href="mailto:hello@gradlogic.com" className="text-sm text-indigo-600 hover:underline">hello@gradlogic.com</a>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Phone</p>
                                            <a href="tel:+919876543210" className="text-sm text-slate-500">+91 98765 43210</a>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Office</p>
                                            <p className="text-sm text-slate-500">Chennai, Tamil Nadu, India</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-8">
                                <h3 className="text-base font-bold text-slate-900">Book a live demo</h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    See the full platform in action with a personalized 30-minute walkthrough.
                                </p>
                                <button className="mt-6 w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                                    Schedule Demo Call
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

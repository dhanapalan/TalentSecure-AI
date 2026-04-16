import { Link } from "react-router-dom";

export default function PrivacyPage() {
    return (
        <div className="bg-slate-50 pt-24">
            <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Legal</p>
                <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                    Privacy Policy
                </h1>
                <p className="mt-4 text-sm text-slate-500">
                    Last updated: February 25, 2026
                </p>

                <div className="mt-10 space-y-8 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
                    <section>
                        <h2 className="text-lg font-bold text-slate-900">What we collect</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            We collect account details, hiring workflow data, assessment results, usage telemetry, and support communication needed to run the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">How we use data</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            We use your data to deliver recruitment workflows, secure assessments, improve product performance, and provide customer support.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">Security and retention</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            Data is protected with access controls, encrypted transport, and audit logging. Records are retained based on contractual and legal requirements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">Contact</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            For privacy requests, email{" "}
                            <a className="font-semibold text-indigo-600 hover:text-indigo-700" href="mailto:hello@gradlogic.com">
                                hello@gradlogic.com
                            </a>
                            .
                        </p>
                    </section>
                </div>

                <div className="mt-8">
                    <Link to="/terms" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                        Read Terms of Service →
                    </Link>
                </div>
            </section>
        </div>
    );
}

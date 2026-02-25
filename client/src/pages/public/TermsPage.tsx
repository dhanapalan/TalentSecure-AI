import { Link } from "react-router-dom";

export default function TermsPage() {
    return (
        <div className="bg-slate-50 pt-24">
            <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Legal</p>
                <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                    Terms of Service
                </h1>
                <p className="mt-4 text-sm text-slate-500">
                    Last updated: February 25, 2026
                </p>

                <div className="mt-10 space-y-8 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
                    <section>
                        <h2 className="text-lg font-bold text-slate-900">Service usage</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            Use of this platform must comply with applicable law, platform policies, and your organization&apos;s hiring and assessment standards.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">Account responsibility</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            You are responsible for account security, user access control, and all activity performed under your organization&apos;s workspace.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">Billing and plans</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            Subscription fees, renewals, and plan limits follow your active contract and pricing plan terms at the time of purchase.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900">Support</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            Need clarification on legal terms? Contact{" "}
                            <a className="font-semibold text-indigo-600 hover:text-indigo-700" href="mailto:hello@nallasconnect.com">
                                hello@nallasconnect.com
                            </a>
                            .
                        </p>
                    </section>
                </div>

                <div className="mt-8">
                    <Link to="/privacy" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                        Read Privacy Policy →
                    </Link>
                </div>
            </section>
        </div>
    );
}

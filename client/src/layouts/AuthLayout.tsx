import { Outlet } from "react-router-dom";
import { CheckCircle2, Globe, Users } from "lucide-react";
import Logo from "../components/Logo";

export default function AuthLayout() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <style>{`
        ::-webkit-scrollbar { display: none; }
        html, body { overflow: hidden; height: 100%; position: fixed; width: 100%; }
        #root { height: 100%; overflow: hidden; }
      `}</style>

      {/* Dynamic Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-200/40 to-cyan-100/30 blur-[100px]" />
        <div className="absolute -right-[5%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-200/30 to-purple-100/20 blur-[80px]" />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center p-4 sm:p-6">
        <div className="grid h-full max-h-[720px] w-full max-w-6xl overflow-hidden rounded-3xl bg-white/70 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] backdrop-blur-2xl lg:grid-cols-2">

          {/* Left Panel: Brand & Features */}
          <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-8 text-white lg:flex xl:p-10">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#4f46e5_0%,transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,#06b6d4_0%,transparent_50%)]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <Logo size={40} />
                <span className="text-xl font-bold tracking-tight">Nallas <span className="text-indigo-400">Connect</span></span>
              </div>

              <div className="mt-8">
                <h1 className="text-3xl font-extrabold tracking-tight xl:text-4xl leading-tight">
                  Connect talent with <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">intelligence.</span>
                </h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
                  Experience the next generation of hiring with AI-powered assessments, applicant tracking, and seamless onboarding — for lateral and campus recruitment.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-6 grid gap-4">
              {[
                { icon: <CheckCircle2 className="h-5 w-5 text-indigo-400" />, title: "Verified Assessments", desc: "Anti-cheating controls and real-time audit logs." },
                { icon: <Globe className="h-5 w-5 text-indigo-400" />, title: "Campus-Scale Onboarding", desc: "Bulk enrollment and automated profile validation." },
                { icon: <Users className="h-5 w-5 text-indigo-400" />, title: "Role-Based Access", desc: "Granular control for admins, staff, and students." }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-colors group-hover:bg-white/10">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-white/50">
                © 2026 Nallas Technologies. All rights reserved.
              </p>
            </div>
          </section>

          {/* Right Panel: Content (LoginPage) */}
          <main className="flex items-center justify-center p-6 bg-white/40 sm:p-10 lg:p-12 overflow-hidden">
            <div className="w-full max-w-sm">
              <div className="mb-6 lg:hidden text-center">
                <div className="flex items-center justify-center gap-2">
                  <Logo size={32} />
                  <span className="text-lg font-bold tracking-tight">Nallas <span className="text-indigo-500">Connect</span></span>
                </div>
              </div>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

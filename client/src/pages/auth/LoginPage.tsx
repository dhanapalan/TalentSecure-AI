import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import api from "../../lib/api";
import { authActions } from "../../stores/authStore";
import {
  getLandingPath,
  getWorkflowRedirectUrl,
} from "../../components/ProtectedRoute";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const onSubmit = async (form: LoginForm) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      const { accessToken, user } = data.data;
      authActions.login(accessToken, user);
      toast.success("Login successful");

      // Small delay to allow browser extensions to finish their operations
      // and prevent "message channel closed" errors during redirect.
      setTimeout(() => {
        const landingPath = getLandingPath(user);
        const workflowRedirect = getWorkflowRedirectUrl(user, landingPath);

        if (workflowRedirect) {
          window.location.replace(workflowRedirect);
          return;
        }
        navigate(landingPath);
      }, 100);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setMsLoading(true);
    try {
      const { data } = await api.get("/auth/microsoft/url");
      if (data?.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      toast.error("Failed to initiate Microsoft login");
      setMsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="text-left">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your credentials to access your dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="block w-full rounded-xl border-0 bg-slate-100/50 py-2.5 pl-9 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              placeholder="name@company.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[10px] font-medium text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Password</label>
            <a href="#" className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-500">
              Forgot?
            </a>
          </div>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              {...register("password", { required: "Password is required" })}
              className="block w-full rounded-xl border-0 bg-slate-100/50 py-2.5 pl-9 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-[10px] font-medium text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              Sign in to Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </button>

        {/* Only show Microsoft login on main TalentSecure platform, not for colleges/students/campuses */}
        {!window.location.hostname.startsWith('college.') &&
          !window.location.hostname.startsWith('campus.') &&
          !window.location.hostname.startsWith('student.') && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                  <span className="bg-white px-3 text-slate-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={loading || msLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {msLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 0H0V10H10V0Z" fill="#F25022" />
                      <path d="M21 0H11V10H21V0Z" fill="#7FBA00" />
                      <path d="M10 11H0V21H10V11Z" fill="#00A4EF" />
                      <path d="M21 11H11V21H21V11Z" fill="#FFB900" />
                    </svg>
                    Sign in with Microsoft
                  </>
                )}
              </button>
            </>
          )}
      </form>

    </div>
  );
}

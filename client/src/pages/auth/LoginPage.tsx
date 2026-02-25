import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const hostname = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const isAdminWorkflow = hostname === "admin" || hostname.startsWith("admin.");

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
      </form>

      {!isAdminWorkflow && (
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Don't have an account?{" "}
            <Link to="/auth/register" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline underline-offset-4">
              Create one
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

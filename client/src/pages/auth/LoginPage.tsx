import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { authActions } from "../../stores/authStore";
import { getLandingPath } from "../../components/ProtectedRoute";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (form: LoginForm) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      const { accessToken, user } = data.data;
      authActions.login(accessToken, user);
      toast.success("Login successful");
      // Redirect to role-appropriate landing page
      navigate(getLandingPath(user));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900">Sign in to your account</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            {...register("email", { required: "Email is required" })}
            className="input-field mt-1"
            placeholder="you@university.edu"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            {...register("password", { required: "Password is required" })}
            className="input-field mt-1"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link to="/auth/register" className="text-primary-600 hover:underline">
          Register
        </Link>
      </p>
    </>
  );
}

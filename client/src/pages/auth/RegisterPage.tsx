import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { authActions } from "../../stores/authStore";

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { role: "STUDENT" },
  });

  const onSubmit = async (form: RegisterForm) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      const { accessToken, user } = data.data;
      authActions.login(accessToken, user);
      toast.success("Registration successful");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900">Create your account</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First name</label>
            <input
              {...register("firstName", { required: "Required" })}
              className="input-field mt-1"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last name</label>
            <input
              {...register("lastName", { required: "Required" })}
              className="input-field mt-1"
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            {...register("email", { required: "Email is required" })}
            className="input-field mt-1"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            {...register("password", { required: "Password is required", minLength: { value: 8, message: "Min 8 characters" } })}
            className="input-field mt-1"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">I am a</label>
          <select {...register("role")} className="input-field mt-1">
            <option value="STUDENT">Student</option>
            <option value="RECRUITER">Recruiter</option>
            <option value="CAMPUS_COORDINATOR">Campus Coordinator</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/auth/login" className="text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

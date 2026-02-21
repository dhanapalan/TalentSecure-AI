import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../lib/api";
import { authActions, useAuthStore } from "../stores/authStore";

type OnboardingForm = {
  dob: string;
  degree: string;
  class_name: string;
  section: string;
};

export default function StudentOnboardingWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingForm>();

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.role !== "student") {
      navigate("/", { replace: true });
      return;
    }
    if (user.is_profile_complete !== false) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  const onSubmit = async (form: OnboardingForm) => {
    setLoading(true);
    try {
      const { data } = await api.put("/students/me/onboarding", {
        dob: form.dob,
        degree: form.degree,
        class: form.class_name,
        section: form.section,
      });

      const updatedUser = data?.data?.user;
      if (updatedUser) {
        authActions.setUser(updatedUser);
      } else if (user) {
        authActions.setUser({
          ...user,
          is_profile_complete: true,
        });
      }

      toast.success("Profile completed successfully");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
      <div className="card w-full">
        <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          Before accessing your dashboard, fill in your onboarding details.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              {...register("dob", { required: "Date of birth is required" })}
              className="input-field mt-1"
            />
            {errors.dob && (
              <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Degree</label>
            <input
              {...register("degree", {
                required: "Degree is required",
                minLength: { value: 2, message: "Minimum 2 characters" },
              })}
              className="input-field mt-1"
              placeholder="B.Tech"
            />
            {errors.degree && (
              <p className="mt-1 text-sm text-red-600">{errors.degree.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <input
              {...register("class_name", {
                required: "Class is required",
              })}
              className="input-field mt-1"
              placeholder="Final Year"
            />
            {errors.class_name && (
              <p className="mt-1 text-sm text-red-600">{errors.class_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Section</label>
            <input
              {...register("section", {
                required: "Section is required",
              })}
              className="input-field mt-1"
              placeholder="A"
            />
            {errors.section && (
              <p className="mt-1 text-sm text-red-600">{errors.section.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save and Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

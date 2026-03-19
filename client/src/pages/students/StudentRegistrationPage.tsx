import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../lib/api";
import {
  CameraIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

// ── Types ────────────────────────────────────────────────────────────────────

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  college_id: string;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function StudentRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Fetch campuses for dropdown
  const { data: campusesData } = useQuery({
    queryKey: ["campuses"],
    queryFn: async () => {
      const { data } = await api.get("/campuses");
      return data.data;
    },
  });

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const [searchParams] = useSearchParams();
  const collegeSlug = searchParams.get("college");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>();

  // Auto-select college from slug
  useEffect(() => {
    if (campusesData && collegeSlug) {
      const match = campusesData.find((c: any) => c.college_code === collegeSlug);
      if (match) {
        setValue("college_id", match.id);
        toast.success(`Registering for ${match.name}`);
      }
    }
  }, [campusesData, collegeSlug, setValue]);

  // ── Start camera ──────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        setCameraError(
          "Camera permission denied. Please allow camera access and try again."
        );
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found. Please connect a webcam.");
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
    }
  }, []);

  // Request camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup stream on unmount
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  // ── Capture snapshot ──────────────────────────────────────────────────────

  const captureSnapshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    // Get data URL for preview
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);

    // Get blob for upload
    canvas.toBlob(
      (blob) => {
        if (blob) setCapturedBlob(blob);
      },
      "image/jpeg",
      0.9
    );
  }, []);

  // ── Retake photo ──────────────────────────────────────────────────────────

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCapturedBlob(null);
  }, []);

  // ── Submit form ───────────────────────────────────────────────────────────

  const onSubmit = async (form: RegisterForm) => {
    if (!capturedBlob) {
      toast.error("Please capture a face photo before registering.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("college_id", form.college_id);
      formData.append("webcam_photo", capturedBlob, "face.jpg");

      await api.post("/students/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Registration successful! Your face photo has been stored.");

      // Stop camera
      streamRef.current?.getTracks().forEach((t) => t.stop());

      // Redirect to login
      setTimeout(() => navigate("/auth/login"), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Student Registration</h1>
          <p className="mt-1.5 text-gray-500">
            Join GradLogic and secure your future with AI-verified assessments.
          </p>
        </div>
        <Link to="/auth/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
          Already registered? Log in
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── Left: Form Fields ──────────────────────────────────────── */}
          <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 italic">
              Personal Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  {...register("name", {
                    required: "Name is required",
                    minLength: { value: 2, message: "Min 2 characters" },
                  })}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white transition-all ring-offset-2"
                  placeholder="e.g. Ravi Kumar"
                />
                {errors.name && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white transition-all ring-offset-2"
                  placeholder="ravi@university.edu"
                />
                {errors.email && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Create Password
                </label>
                <input
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Min 6 characters" },
                  })}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white transition-all ring-offset-2"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Select Your College
                </label>
                <div className="relative">
                  <AcademicCapIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <select
                    {...register("college_id", {
                      required: "Please select your institution",
                    })}
                    className="w-full appearance-none rounded-xl border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="">Choose an institution...</option>
                    {campusesData?.map((campus: any) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name} ({campus.city})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.college_id && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.college_id.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Camera ──────────────────────────────────────────── */}
          <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm flex flex-col items-center">
            <h2 className="self-start text-xl font-bold text-gray-900 italic">
              Face ID Setup
            </h2>

            {/* Camera error */}
            {cameraError && (
              <div className="w-full rounded-2xl bg-red-50 p-4 text-center text-sm text-red-700 border border-red-100">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn-secondary mt-3 text-xs"
                >
                  <ArrowPathIcon className="mr-1 h-4 w-4" />
                  Retry Camera Access
                </button>
              </div>
            )}

            {/* Live or captured preview */}
            <div className="relative w-full overflow-hidden rounded-2xl bg-gray-900 shadow-inner">
              {/* Live video (hidden when captured) */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`aspect-[4/3] w-full object-cover ${capturedImage ? "hidden" : ""
                  }`}
              />

              {/* Captured image preview */}
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="aspect-[4/3] w-full object-cover"
                />
              )}

              {/* Overlay for captured state */}
              {capturedImage && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-2 text-sm font-bold text-green-600 shadow-lg">
                    <CheckCircleIcon className="h-5 w-5" />
                    Identity Captured
                  </div>
                </div>
              )}
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera controls */}
            <div className="flex gap-4">
              {!capturedImage ? (
                <button
                  type="button"
                  onClick={captureSnapshot}
                  disabled={!cameraReady}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-full disabled:opacity-50 hover:scale-105 transition-transform"
                >
                  <CameraIcon className="h-5 w-5" />
                  Capture Identity
                </button>
              ) : (
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="btn-secondary flex items-center gap-2 px-6 py-2.5 rounded-full hover:bg-gray-100 transition-all"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Retake Photo
                </button>
              )}
            </div>

            <p className="text-center text-xs text-gray-400 max-w-xs">
              Position yourself in the center and ensure good lighting. This photo will be used for AI proctoring verification.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-10 flex justify-center">
          <button
            type="submit"
            disabled={loading || !capturedBlob}
            className="btn-primary px-12 py-4 text-lg font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Registering...
              </span>
            ) : (
              "Complete Registration"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

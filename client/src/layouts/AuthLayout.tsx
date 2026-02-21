import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">TalentSecure AI</h1>
          <p className="mt-2 text-primary-200">
            AI-powered campus recruitment platform
          </p>
        </div>
        <div className="card">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

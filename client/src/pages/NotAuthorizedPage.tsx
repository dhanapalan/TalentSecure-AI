import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { getLandingPath } from "../components/ProtectedRoute";

export default function NotAuthorizedPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-10 w-10 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Access Denied
        </h1>
        <p className="mt-2 text-gray-500">
          You don't have permission to view this page.
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Your role:{" "}
          <span className="font-medium text-gray-600">
            {user?.role ?? "unknown"}
          </span>
        </p>

        <Link
          to={getLandingPath(user)}
          className="btn-primary mt-8 inline-block"
        >
          Go to your Dashboard
        </Link>
      </div>
    </div>
  );
}

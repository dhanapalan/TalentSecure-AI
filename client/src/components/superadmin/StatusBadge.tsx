type KnownStatus = "active" | "pending" | "suspended" | "inactive" | "success" | "error";

interface StatusBadgeProps {
  // Known statuses get semantic colors; anything else falls back to a neutral badge.
  status: KnownStatus | (string & {});
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export default function StatusBadge({
  status,
  label,
  size = "md",
}: StatusBadgeProps) {
  const statusConfig: Record<KnownStatus, { bg: string; text: string; dot: string; label: string }> = {
    active: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-400",
      label: label || "Active",
    },
    pending: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      dot: "bg-yellow-400",
      label: label || "Pending",
    },
    suspended: {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-400",
      label: label || "Suspended",
    },
    inactive: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      dot: "bg-gray-400",
      label: label || "Inactive",
    },
    success: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-400",
      label: label || "Success",
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-400",
      label: label || "Error",
    },
  };

  const config = statusConfig[status as KnownStatus] || {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
    label: label || String(status),
  };
  const sizeClass =
    size === "xs" || size === "sm"
      ? "px-2 py-1 text-xs"
      : size === "lg"
        ? "px-4 py-2 text-base"
        : "px-3 py-1.5 text-sm";

  return (
    <span
      className={`
        inline-flex items-center gap-2 rounded-full
        font-medium
        ${config.bg} ${config.text} ${sizeClass}
      `}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

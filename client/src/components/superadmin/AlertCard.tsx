import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface AlertCardProps {
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

export default function AlertCard({
  type,
  title,
  message,
  action,
  onClose,
}: AlertCardProps) {
  const alertConfig = {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: InformationCircleIcon,
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: ExclamationTriangleIcon,
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: CheckCircleIcon,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: XCircleIcon,
    },
  };

  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        ${config.bg} ${config.border} border rounded-lg p-4
        flex items-start gap-3
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${config.text}`}>{title}</p>
        <p className={`text-sm mt-1 ${config.text} opacity-90`}>{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className={`
              mt-2 text-sm font-medium
              ${config.text} underline hover:opacity-75 transition-opacity
            `}
          >
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${config.text} hover:opacity-75 transition-opacity`}
        >
          <span className="text-xl">&times;</span>
        </button>
      )}
    </div>
  );
}

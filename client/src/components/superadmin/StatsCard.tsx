import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  onClick?: () => void;
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  loading = false,
  onClick,
}: StatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-200 p-6
        ${onClick ? "cursor-pointer hover:shadow-md hover:border-gray-300" : ""}
        transition-all duration-200
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          )}
          {trend && !loading && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`
                  text-sm font-medium
                  ${trend.isPositive ? "text-green-600" : "text-red-600"}
                `}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface ChartData {
  label: string;
  value: number;
}

interface ChartCardProps {
  title: string;
  data: ChartData[];
  type?: "bar" | "line" | "area";
  loading?: boolean;
}

export default function ChartCard({
  title,
  data,
  type = "bar",
  loading = false,
}: ChartCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm font-medium text-gray-600 mb-4">{title}</p>
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const scale = 100 / maxValue;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-600 mb-4">{title}</p>
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-sm font-semibold text-blue-600">{item.value}</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${item.value * scale}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

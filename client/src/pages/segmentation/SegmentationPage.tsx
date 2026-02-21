import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";

export default function SegmentationPage() {
  const { data: segments, isLoading } = useQuery({
    queryKey: ["segments"],
    queryFn: async () => {
      const { data } = await api.get("/segmentation/segments");
      return data.data;
    },
  });

  const handleRunSegmentation = async () => {
    try {
      await api.post("/segmentation/run", { algorithm: "kmeans", features: ["cgpa", "skills", "behavioral"] });
    } catch {
      // handled by interceptor
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Segmentation</h1>
          <p className="mt-1 text-gray-500">
            Smart student segmentation using AI-powered clustering
          </p>
        </div>
        <button onClick={handleRunSegmentation} className="btn-primary">
          Run Segmentation
        </button>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-gray-400">Loading segments…</p>
        ) : (
          segments?.map((seg: any) => (
            <div key={seg.id} className="card">
              <h3 className="text-lg font-semibold text-gray-900">{seg.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{seg.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary-600">{seg.studentCount}</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {(seg.avgMatchScore * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">Avg Match</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

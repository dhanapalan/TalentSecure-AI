import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import {
  SparklesIcon,
  ChartBarIcon,
  BeakerIcon,
  ArrowPathIcon,
  VariableIcon,
  AcademicCapIcon,
  FaceSmileIcon,
  CpuChipIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function SegmentationPage() {
  const { data: segments, isLoading, refetch } = useQuery({
    queryKey: ["segments"],
    queryFn: async () => {
      const { data } = await api.get("/segmentation/segments");
      return data.data;
    },
  });

  const handleRunSegmentation = async () => {
    const loadingToast = toast.loading("AI Engine is clustering talent pool...");
    try {
      await api.post("/segmentation/run", { algorithm: "kmeans", features: ["cgpa", "skills", "behavioral"] });
      toast.success("Segmentation completed successfully", { id: loadingToast });
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Segmentation failed", { id: loadingToast });
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -m-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -m-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 ring-1 ring-inset ring-indigo-500/20 mb-4">
              <SparklesIcon className="h-4 w-4" />
              <span>AI-Powered Insights</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Smart Talent <span className="text-indigo-400">Segmentation</span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 leading-relaxed">
              Unlocking hidden potential using K-Means clustering. Our AI engine analyzes academic multi-dimensional data to discover unique student archetypes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button
                onClick={handleRunSegmentation}
                className="group relative flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-gray-900 hover:bg-gray-50 transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                <ArrowPathIcon className="h-5 w-5 text-indigo-600 group-hover:rotate-180 transition-transform duration-500" />
                Run AI Analysis
              </button>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-900 bg-indigo-600 text-[10px] font-bold">
                  +1k
                </div>
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Processed Daily</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="w-64 h-64 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 animate-pulse">
              <CpuChipIcon className="h-40 w-40 text-indigo-500/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Automated Discovery",
            desc: "Instead of raw filtering, AI identifies clusters of excellence across diverse skill sets.",
            icon: BeakerIcon,
            color: "text-blue-500",
            bg: "bg-blue-50"
          },
          {
            title: "Archetype Mapping",
            desc: "Groups students into 'Problem Solvers', 'Tech Specialists', and 'Behavioral Leaders'.",
            icon: VariableIcon,
            color: "text-purple-500",
            bg: "bg-purple-50"
          },
          {
            title: "Data-Driven Decisions",
            desc: "Recruit based on statistical suitability rather than anecdotal evidence.",
            icon: ChartBarIcon,
            color: "text-indigo-500",
            bg: "bg-indigo-50"
          }
        ].map((item, idx) => (
          <div key={idx} className="card p-6 border-none bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-2 rounded-lg w-fit mb-4 ${item.bg}`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{item.title}</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* How it Works Section */}
      <div className="rounded-3xl bg-gray-50 p-8 border border-gray-100">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-8">The Segmentation Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center">
              <AcademicCapIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-xs font-bold text-gray-600">Ingest Data</p>
          </div>
          <div className="hidden md:flex justify-center text-gray-300">
            <ChevronRightIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-indigo-500" />
            </div>
            <p className="text-xs font-bold text-gray-600">Apply K-Means</p>
          </div>
          <div className="hidden md:flex justify-center text-gray-300">
            <ChevronRightIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center">
              <FaceSmileIcon className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-xs font-bold text-gray-600">Render Clusters</p>
          </div>
        </div>
      </div>

      {/* Segments Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Clusters</h2>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-full">
            {segments?.length || 0} Discovery Results
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="card h-40 animate-pulse bg-gray-50 border-none"></div>
            ))
          ) : !segments || segments.length === 0 ? (
            <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <BeakerIcon className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Segments Computed</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Analysis hasn't been run yet or there is insufficient data in the talent pool for clustering.
              </p>
              <button
                onClick={handleRunSegmentation}
                className="mt-6 text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
              >
                Run First Analysis →
              </button>
            </div>
          ) : (
            segments.map((seg: any) => (
              <div key={seg.id} className="card group hover:shadow-xl hover:ring-2 hover:ring-indigo-500/20 transition-all border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-black text-gray-900 leading-tight">{seg.name}</h3>
                  <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">{seg.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-2xl font-black text-indigo-600">{seg.studentCount}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Students Found</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-600">
                      {(seg.avgMatchScore * 100).toFixed(0)}%
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suitability</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

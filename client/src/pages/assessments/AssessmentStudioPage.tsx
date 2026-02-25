import { useSearchParams } from "react-router-dom";
import {
    ClipboardDocumentListIcon,
    BookOpenIcon,
    ChartBarSquareIcon,
    PlusIcon,
    SparklesIcon
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import AssessmentsPage from "./AssessmentsPage";
import QuestionBankPage from "./QuestionBankPage";

type TabId = "live" | "bank" | "results";

export default function AssessmentStudioPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get("tab") as TabId) || "live";

    const tabs = [
        { id: "live", name: "Live Assessments", icon: ClipboardDocumentListIcon },
        { id: "bank", name: "Question Bank", icon: BookOpenIcon },
        { id: "results", name: "Result Analytics", icon: ChartBarSquareIcon },
    ];

    return (
        <div className="space-y-8 pb-20">
            {/* Studio Header */}
            <div className="relative overflow-hidden rounded-3xl bg-indigo-600 px-8 py-10 text-white shadow-xl">
                <div className="absolute top-0 right-0 -m-12 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white mb-4 backdrop-blur-md">
                            <SparklesIcon className="h-4 w-4" />
                            <span>Unified Workshop</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                            Assessment <span className="text-indigo-200">Studio</span>
                        </h1>
                        <p className="mt-2 text-indigo-100 font-medium">
                            Create, curate, and monitor your talent discovery pipeline in one place.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg active:scale-95">
                            <PlusIcon className="h-5 w-5" />
                            Quick Question
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSearchParams({ tab: tab.id })}
                        className={clsx(
                            "group relative flex items-center gap-2.5 px-6 py-4 text-sm font-black transition-all",
                            activeTab === tab.id
                                ? "text-indigo-600 after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:rounded-t-full after:bg-indigo-600"
                                : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <tab.icon className={clsx("h-5 w-5", activeTab === tab.id ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500")} />
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "live" && <AssessmentsPage isStudioView />}
                {activeTab === "bank" && <QuestionBankPage isStudioView />}
                {activeTab === "results" && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="rounded-full bg-gray-50 p-6 mb-6">
                            <ChartBarSquareIcon className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Analytics Dashboard</h3>
                        <p className="mt-2 text-gray-500 max-w-sm">
                            Detailed performance analytics and candidate ranking will appear here once assessments are completed.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

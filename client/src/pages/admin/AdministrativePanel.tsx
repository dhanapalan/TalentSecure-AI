import { useState } from "react";
import UserManagementPage from "./UserManagementPage";
import RoleManagement from "../hr/RoleManagement";
import {
    UsersIcon,
    BriefcaseIcon,
    ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";

type TabType = "users" | "roles" | "audit";

export default function AdministrativePanel() {
    const [activeTab, setActiveTab] = useState<TabType>("users");

    const tabs = [
        { id: "users", name: "System Personnel", icon: UsersIcon, description: "Manage user access and system roles" },
        { id: "roles", name: "Job Roles", icon: BriefcaseIcon, description: "Define recruitment positions and requirements" },
        { id: "audit", name: "Security Logs", icon: ShieldCheckIcon, description: "View system audit and access history" },
    ];

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Administrative Hub</h1>
                <p className="text-gray-500 text-sm font-medium">Coordinate your team, recruitment, and system security from a single umbrella.</p>
            </div>

            {/* Modern Tab Bar */}
            <div className="flex items-center gap-1 p-1 bg-gray-100/80 backdrop-blur-sm rounded-2xl w-fit border border-gray-200">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={clsx(
                                "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                isActive
                                    ? "bg-white text-primary-600 shadow-sm ring-1 ring-black/5 scale-[1.02]"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            )}
                        >
                            <tab.icon className={clsx("h-4.5 w-4.5", isActive ? "text-primary-600" : "text-gray-400")} />
                            {tab.name}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content Umbrella */}
            <div className="mt-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2">
                {activeTab === "users" && <UserManagementPage />}
                {activeTab === "roles" && <RoleManagement />}
                {activeTab === "audit" && (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                        <div className="h-16 w-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                            <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Security Audit Logs</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-sm text-center px-6">
                            Audit log integration is currently processing. You'll soon be able to track every system change and access attempt here.
                        </p>
                        <div className="mt-6 flex gap-2">
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100">
                                Pending Integration
                            </span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                                V2 Feature
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

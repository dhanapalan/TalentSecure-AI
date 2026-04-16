import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    MessageSquare,
    Send,
    Users,
    CheckCheck,
    Clock,
} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import clsx from "clsx";

interface MessageTemplate {
    id: string;
    label: string;
    subject: string;
    body: string;
}

const TEMPLATES: MessageTemplate[] = [
    {
        id: "exam_reminder",
        label: "Exam Reminder",
        subject: "Reminder: Upcoming Assessment",
        body: "Dear Student,\n\nThis is a reminder that you have an upcoming assessment scheduled. Please ensure you are prepared and log in on time.\n\nBest regards,\nCampus Placement Team",
    },
    {
        id: "result_published",
        label: "Results Published",
        subject: "Your Assessment Results are Now Available",
        body: "Dear Student,\n\nYour assessment results have been published. Please log in to the portal to view your scores.\n\nBest regards,\nCampus Placement Team",
    },
    {
        id: "drive_announcement",
        label: "Drive Announcement",
        subject: "New Recruitment Drive Announced",
        body: "Dear Student,\n\nWe are pleased to announce a new recruitment drive. Please visit the portal for details and register before the deadline.\n\nBest regards,\nCampus Placement Team",
    },
];

interface SentMessage {
    id: string;
    subject: string;
    recipient_group: string;
    sent_at: string;
    status: "sent" | "pending" | "failed";
    recipient_count: number;
}

export default function CommunicationsPage() {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [recipientGroup, setRecipientGroup] = useState("all");
    const [sending, setSending] = useState(false);
    const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);

    const { data: summary } = useQuery({
        queryKey: ["college-dashboard", "summary"],
        queryFn: async () => {
            const res = await api.get("/college/dashboard/summary");
            return res.data.data;
        },
    });

    const applyTemplate = (template: MessageTemplate) => {
        setSubject(template.subject);
        setBody(template.body);
    };

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            toast.error("Subject and message body are required.");
            return;
        }
        setSending(true);
        try {
            // Simulated send — replace with real API call when endpoint is available
            await new Promise((resolve) => setTimeout(resolve, 800));
            const recipientCount =
                recipientGroup === "all"
                    ? summary?.total_students ?? 0
                    : recipientGroup === "active"
                    ? summary?.active_students ?? 0
                    : Math.floor((summary?.total_students ?? 0) * 0.3);

            setSentMessages((prev) => [
                {
                    id: crypto.randomUUID(),
                    subject,
                    recipient_group: recipientGroup,
                    sent_at: new Date().toISOString(),
                    status: "sent",
                    recipient_count: recipientCount,
                },
                ...prev,
            ]);
            setSubject("");
            setBody("");
            toast.success("Message sent successfully!");
        } catch {
            toast.error("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Communications</h1>
                <p className="mt-1 text-slate-500 font-medium">Send announcements and messages to your campus students.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compose Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Templates */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-indigo-500" />
                            Quick Templates
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => applyTemplate(t)}
                                    className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-all"
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Compose Form */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <Send className="h-5 w-5 text-blue-500" />
                            Compose Message
                        </h2>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Recipients</label>
                            <select
                                value={recipientGroup}
                                onChange={(e) => setRecipientGroup(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">All Students ({summary?.total_students ?? 0})</option>
                                <option value="active">Active Students ({summary?.active_students ?? 0})</option>
                                <option value="at_risk">At-Risk Students</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                            <input
                                type="text"
                                placeholder="Enter message subject..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Message</label>
                            <textarea
                                placeholder="Type your message here..."
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={7}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={sending || !subject.trim() || !body.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                        >
                            {sending ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {sending ? "Sending..." : "Send Message"}
                        </button>
                    </div>
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <Users className="h-5 w-5 text-slate-400" />
                            Audience Overview
                        </h2>
                        {[
                            { label: "Total Students", value: summary?.total_students ?? 0, icon: Users, color: "indigo" },
                            { label: "Active Students", value: summary?.active_students ?? 0, icon: CheckCheck, color: "emerald" },
                            { label: "Messages Sent", value: sentMessages.length, icon: Send, color: "blue" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "p-2 rounded-lg",
                                        item.color === "indigo" && "bg-indigo-50 text-indigo-600",
                                        item.color === "emerald" && "bg-emerald-50 text-emerald-600",
                                        item.color === "blue" && "bg-blue-50 text-blue-600",
                                    )}>
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600">{item.label}</span>
                                </div>
                                <span className="text-lg font-black text-slate-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sent History */}
            {sentMessages.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-slate-400" />
                            Recent Messages
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400">
                                    <th className="px-6 py-4 font-bold">Subject</th>
                                    <th className="px-6 py-4 font-bold">Recipients</th>
                                    <th className="px-6 py-4 font-bold text-center">Count</th>
                                    <th className="px-6 py-4 font-bold text-center">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Sent At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sentMessages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{msg.subject}</td>
                                        <td className="px-6 py-4 text-slate-600 font-medium capitalize">{msg.recipient_group.replace("_", " ")}</td>
                                        <td className="px-6 py-4 text-center font-black text-slate-900">{msg.recipient_count}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                <CheckCheck className="h-3 w-3" />
                                                Sent
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 font-medium">
                                            {new Date(msg.sent_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

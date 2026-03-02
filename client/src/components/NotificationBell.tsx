import { useState, useRef, useEffect } from "react";
import { useNotifications, DashboardNotification } from "../hooks/useNotifications";
import { BellIcon } from "@heroicons/react/24/outline";

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleNotificationClick = (n: DashboardNotification) => {
        if (!n.is_read) {
            markAsRead(n.id);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden flex flex-col max-h-[80vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markAllAsRead();
                                }}
                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                title="Mark all as read"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="flex-1 overflow-y-auto min-h-[100px]">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                <BellIcon className="h-8 w-8 text-slate-200 mb-2" />
                                <p className="text-sm text-slate-500">You don't have any notifications yet.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {notifications.map((n) => (
                                    <li
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`block px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/50' : 'bg-white'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm tracking-tight ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                    {n.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                    {n.message}
                                                </p>
                                                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                                                    {new Date(n.created_at).toLocaleString(undefined, {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import { 
  UsersIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline";

// Dummy Staff Data
const STAFF = [
  { id: "1", name: "Dhanapalan C", email: "dhanapalan@nallas.com", role: "College Admin", status: "Active", lastActive: "10 mins ago", avatar: "DC" },
  { id: "2", name: "Priya Sharma", email: "priya.sharma@nallas.com", role: "College Staff", status: "Active", lastActive: "2 hours ago", avatar: "PS" },
  { id: "3", name: "Rahul Verma", email: "rahul.verma@nallas.com", role: "College Staff", status: "Offline", lastActive: "Yesterday", avatar: "RV" },
  { id: "4", name: "Anita Kumar", email: "anita.k@nallas.com", role: "College Admin", status: "Pending", lastActive: "Never", avatar: "AK" }
];

export default function CollegeAdminsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 py-6 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UsersIcon className="h-7 w-7 text-indigo-600" />
              Campus Admins
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">Manage staff access and permissions for the portal</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-md transition-colors">
              <UserPlusIcon className="h-4 w-4" />
              Invite Staff
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Analytics Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <Cog6ToothIcon className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-slate-900 font-black text-lg">System Permissions</h3>
              <p className="text-slate-500 text-sm mt-1">
                Admins have full access. Staff can manage students and view insights, but cannot invite new users.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-2xl font-black text-indigo-600">2</div>
              <div className="text-xs font-bold text-slate-400">Admins</div>
            </div>
            <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-2xl font-black text-emerald-600">2</div>
              <div className="text-xs font-bold text-slate-400">Staff</div>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider font-bold text-slate-500">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {STAFF.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {staff.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{staff.name}</div>
                        <div className="text-slate-500 text-xs font-medium">{staff.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {staff.role}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                      staff.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      staff.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {staff.lastActive}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

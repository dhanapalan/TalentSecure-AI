import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import toast from "react-hot-toast";
import {
  CreditCardIcon,
  CheckCircleIcon,
  BanknotesIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface DepartmentSummary {
  department: string;
  total_students: number;
  paid: number;
  pending: number;
  waived: number;
  collected: string;
  outstanding: string;
}

interface FeeSummary {
  academic_year: string;
  fee_per_student: number;
  totals: {
    total: number;
    paid: number;
    pending: number;
    collected: string;
    outstanding: string;
  } | null;
  departments: DepartmentSummary[];
}

interface StudentFee {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  department: string | null;
  academic_year: string;
  amount: string;
  status: "pending" | "paid" | "waived";
  paid_at: string | null;
  payment_method: string | null;
  payment_ref: string | null;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [payingFee, setPayingFee] = useState<StudentFee | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");

  // Department-wise summary
  const { data: summary, isLoading: summaryLoading } = useQuery<FeeSummary>({
    queryKey: ["student-fee-summary"],
    queryFn: async () => {
      const { data } = await api.get("/billing/student-fees/summary");
      return data.data;
    },
  });

  // Student-level fee list
  const { data: feesData, isLoading: feesLoading } = useQuery({
    queryKey: ["student-fees", departmentFilter, statusFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (departmentFilter) params.set("department", departmentFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const { data } = await api.get(`/billing/student-fees?${params}`);
      return data;
    },
  });

  // Generate fee records for all active students
  const generateMutation = useMutation({
    mutationFn: async () => api.post("/billing/student-fees/generate", {}),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["student-fee-summary"] });
      queryClient.invalidateQueries({ queryKey: ["student-fees"] });
      toast.success(res.data?.message || "Fee records generated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to generate fee records");
    },
  });

  // Record a payment
  const payMutation = useMutation({
    mutationFn: async (feeId: string) =>
      api.post(`/billing/student-fees/${feeId}/pay`, {
        payment_method: paymentMethod,
        payment_ref: paymentRef || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-fee-summary"] });
      queryClient.invalidateQueries({ queryKey: ["student-fees"] });
      setPayingFee(null);
      setPaymentRef("");
      toast.success("Payment recorded");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to record payment");
    },
  });

  const totals = summary?.totals;
  const fees: StudentFee[] = feesData?.data || [];
  const meta = feesData?.meta;

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: "bg-green-50 text-green-700",
      pending: "bg-yellow-50 text-yellow-700",
      waived: "bg-gray-100 text-gray-600",
    };
    return `${styles[status] || styles.pending} px-3 py-1 rounded-full text-xs font-bold`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Student Fee Billing</h1>
          <p className="mt-1 text-sm text-gray-500">
            ₹{summary?.fee_per_student ?? 500} per student per year · Academic year{" "}
            {summary?.academic_year ?? ""}
          </p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowPathIcon className="h-4 w-4" />
          {generateMutation.isPending ? "Generating..." : "Generate Fee Records"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <UserGroupIcon className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-bold text-gray-600">Total Students</p>
          </div>
          <p className="text-3xl font-black text-gray-900">{totals?.total ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <p className="text-sm font-bold text-gray-600">Paid</p>
          </div>
          <p className="text-3xl font-black text-green-700">{totals?.paid ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ClockIcon className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-bold text-gray-600">Pending</p>
          </div>
          <p className="text-3xl font-black text-yellow-700">{totals?.pending ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <BanknotesIcon className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-bold text-gray-600">Collected</p>
          </div>
          <p className="text-3xl font-black text-gray-900">₹{Number(totals?.collected ?? 0).toLocaleString("en-IN")}</p>
          <p className="text-xs text-gray-500 mt-1">
            ₹{Number(totals?.outstanding ?? 0).toLocaleString("en-IN")} outstanding
          </p>
        </div>
      </div>

      {/* Department-wise rollup */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-gray-900">Department-wise Collection</h2>
        </div>
        {summaryLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (summary?.departments?.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CreditCardIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700 mb-1">No fee records yet</p>
            <p className="text-sm">Click "Generate Fee Records" to create ₹500 fee entries for all active students.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-slate-700">Department</th>
                <th className="px-6 py-3 text-right font-bold text-slate-700">Students</th>
                <th className="px-6 py-3 text-right font-bold text-slate-700">Paid</th>
                <th className="px-6 py-3 text-right font-bold text-slate-700">Pending</th>
                <th className="px-6 py-3 text-right font-bold text-slate-700">Collected</th>
                <th className="px-6 py-3 text-right font-bold text-slate-700">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {summary!.departments.map((dept) => (
                <tr
                  key={dept.department}
                  onClick={() => {
                    setDepartmentFilter(dept.department === departmentFilter ? "" : dept.department);
                    setPage(1);
                  }}
                  className={`cursor-pointer hover:bg-slate-50 ${
                    departmentFilter === dept.department ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-6 py-4 font-bold text-gray-900">{dept.department}</td>
                  <td className="px-6 py-4 text-right text-gray-700">{dept.total_students}</td>
                  <td className="px-6 py-4 text-right text-green-700 font-bold">{dept.paid}</td>
                  <td className="px-6 py-4 text-right text-yellow-700 font-bold">{dept.pending}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ₹{Number(dept.collected).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    ₹{Number(dept.outstanding).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Student-level list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-gray-900 mr-auto">
            Students{departmentFilter ? ` — ${departmentFilter}` : ""}
          </h2>
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or email..."
              className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-gray-700"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="waived">Waived</option>
          </select>
          {departmentFilter && (
            <button
              onClick={() => setDepartmentFilter("")}
              className="px-3 py-2 text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Clear dept filter
            </button>
          )}
        </div>

        {feesLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : fees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No student fee records found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-slate-700">Student</th>
                <th className="px-6 py-3 text-left font-bold text-slate-700">Department</th>
                <th className="px-6 py-3 text-right font-bold text-slate-700">Amount</th>
                <th className="px-6 py-3 text-left font-bold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left font-bold text-slate-700">Paid On</th>
                <th className="px-6 py-3 text-right font-bold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {fees.map((fee) => (
                <tr key={fee.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{fee.student_name}</p>
                    <p className="text-xs text-gray-500">{fee.student_email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{fee.department || "Unassigned"}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ₹{Number(fee.amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={statusBadge(fee.status)}>{fee.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {fee.paid_at ? (
                      <>
                        {new Date(fee.paid_at).toLocaleDateString()}
                        {fee.payment_method && (
                          <span className="text-xs text-gray-400 ml-1">({fee.payment_method})</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {fee.status === "pending" && (
                      <button
                        onClick={() => setPayingFee(fee)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 font-bold text-xs rounded-lg hover:bg-green-100 border border-green-200"
                      >
                        <BanknotesIcon className="h-4 w-4" />
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm">
            <p className="text-gray-600">
              Page {meta.page} of {meta.totalPages} · {meta.total} students
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPages}
                className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record payment modal */}
      {payingFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
              <p className="text-sm text-gray-500 mt-1">
                {payingFee.student_name} · ₹{Number(payingFee.amount).toLocaleString("en-IN")} ·{" "}
                {payingFee.academic_year}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`px-4 py-2 rounded-lg font-bold border-2 transition-colors ${
                        paymentMethod === m.value
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-slate-200 text-gray-700 hover:border-slate-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Reference # <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="UPI txn id, receipt no., etc."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setPayingFee(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-gray-700 font-bold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => payMutation.mutate(payingFee.id)}
                disabled={payMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {payMutation.isPending ? "Saving..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

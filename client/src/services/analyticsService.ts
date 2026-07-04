import api from "../lib/api";

export interface PlatformAnalytics {
  summary: {
    total_users: string;
    active_users: string;
    student_count: string;
    admin_count: string;
    total_colleges: string;
    total_questions: string;
    total_attempts: string;
    avg_score: string;
    total_workflows: string;
    total_roles: string;
    total_audit_logs: string;
  };
  users_growth: { date: string; new_users: string }[];
  attempts_trend: { date: string; attempts: string }[];
  questions_by_category: { category: string; count: string }[];
}

export interface CollegeAnalytics {
  id: string;
  name: string;
  status: string;
  student_count: string;
  attempts: string;
  avg_score: string;
  paid_students: string;
  collected: string;
}

export interface BillingSummary {
  academic_year: string;
  fee_per_student: number;
  total_students: number;
  paid: number;
  pending: number;
  collected: number;
  expected: number;
  by_college: {
    id: string;
    name: string;
    students: string;
    paid: string;
    collected: string;
  }[];
  recent_payments: {
    id: string;
    amount: string;
    status: string;
    payment_method: string | null;
    paid_at: string | null;
    student_name: string | null;
    college_name: string | null;
  }[];
}

class AnalyticsService {
  async getPlatform(days = 30): Promise<PlatformAnalytics> {
    const response = await api.get(`/superadmin/analytics/platform?days=${days}`);
    return response.data?.data;
  }

  async getColleges(): Promise<CollegeAnalytics[]> {
    const response = await api.get("/superadmin/analytics/colleges");
    return response.data?.data || [];
  }

  async getBillingSummary(year?: string): Promise<BillingSummary> {
    const qs = year ? `?year=${encodeURIComponent(year)}` : "";
    const response = await api.get(`/superadmin/billing/summary${qs}`);
    return response.data?.data;
  }
}

export default new AnalyticsService();

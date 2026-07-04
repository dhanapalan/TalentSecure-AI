import api from "../lib/api";

export interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  changes?: any;
  ip_address: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  created_at: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  action?: string;
  user_id?: string;
  resource_type?: string;
  from_date?: string;
  to_date?: string;
  severity?: string;
}

export interface AuditTrailResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuditStats {
  total_actions: number;
  period_days: number;
  by_action: Array<{ action: string; count: number }>;
  by_user: Array<{ full_name: string; email: string; count: number }>;
  by_resource_type: Array<{ resource_type: string; count: number }>;
}

class AuditService {
  /**
   * List audit logs
   */
  async listAuditTrail(filters: AuditFilters = {}): Promise<AuditTrailResponse> {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.action && filters.action !== "all") params.append("action", filters.action);
      if (filters.user_id && filters.user_id !== "all") params.append("user_id", filters.user_id);
      if (filters.resource_type && filters.resource_type !== "all")
        params.append("resource_type", filters.resource_type);
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);
      if (filters.severity && filters.severity !== "all") params.append("severity", filters.severity);

      const response = await api.get(
        `/superadmin/audit-trail?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to list audit trail:", error);
      throw error;
    }
  }

  /**
   * Get single audit entry
   */
  async getAuditEntry(entryId: string): Promise<AuditLog> {
    try {
      const response = await api.get(`/superadmin/audit-trail/${entryId}`);
      return response.data?.data;
    } catch (error) {
      console.error(`Failed to get audit entry ${entryId}:`, error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(days: number = 30): Promise<AuditStats> {
    try {
      const response = await api.get(
        `/superadmin/audit-trail/stats?days=${days}`
      );
      return response.data?.data;
    } catch (error) {
      console.error("Failed to get audit stats:", error);
      throw error;
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(data: {
    format: "csv" | "json";
    from_date?: string;
    to_date?: string;
    action?: string;
  }): Promise<void> {
    try {
      const response = await api.post(
        "/superadmin/audit-trail/export",
        data,
        {
          responseType: data.format === "csv" ? "blob" : "json",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `audit-logs-${new Date().toISOString()}.${data.format}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export audit logs:", error);
      throw error;
    }
  }
}

export default new AuditService();

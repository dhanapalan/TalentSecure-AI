import api from "../lib/api";

export interface PlatformMetrics {
  totalColleges: number;
  totalStudents: number;
  activeUsers: number;
  totalQuestions: number;
  totalTests: number;
  certifications: number;
  pendingApprovals: number;
  avgPlacementReadiness?: number;
}

export interface GrowthData {
  label: string;
  value: number;
}

export interface SystemAlert {
  id: string;
  type: "info" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  user: string;
  entity: string;
  timestamp: string;
  details?: string;
}

export interface PendingApproval {
  id: string;
  name: string;
  email: string;
  type: string;
  date: string;
  link?: string;
}

export interface MostActiveCollege {
  id: string;
  name: string;
  studentCount: number;
  activityScore: number;
}

const CACHE_DURATION = 30000; // 30 seconds

class SuperAdminMetricsService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }

  private getFromCache<T>(key: string): T | null {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)?.data || null;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getPlatformMetrics(): Promise<PlatformMetrics> {
    const cacheKey = "platform_metrics";
    const cached = this.getFromCache<PlatformMetrics>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get("/superadmin/metrics/platform");
      const data = response.data?.data || response.data || {
        totalColleges: 0,
        totalStudents: 0,
        activeUsers: 0,
        totalQuestions: 0,
        totalTests: 0,
        certifications: 0,
        pendingApprovals: 0,
      };
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to fetch platform metrics:", error);
      return {
        totalColleges: 0,
        totalStudents: 0,
        activeUsers: 0,
        totalQuestions: 0,
        totalTests: 0,
        certifications: 0,
        pendingApprovals: 0,
      };
    }
  }

  async getGrowthData(): Promise<GrowthData[]> {
    const cacheKey = "growth_data";
    const cached = this.getFromCache<GrowthData[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get("/superadmin/metrics/growth");
      const data = response.data?.data || response.data || [];
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to fetch growth data:", error);
      return [];
    }
  }

  async getSystemAlerts(): Promise<SystemAlert[]> {
    const cacheKey = "system_alerts";
    const cached = this.getFromCache<SystemAlert[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get("/superadmin/metrics/alerts");
      const data = response.data?.data || response.data || [];
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to fetch system alerts:", error);
      return [];
    }
  }

  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    const cacheKey = "recent_activities";
    const cached = this.getFromCache<RecentActivity[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get("/superadmin/audit-trail", { params: { limit } });
      const logs = response.data?.data || [];
      const activities: RecentActivity[] = logs.slice(0, limit).map((log: any) => ({
        id: log.id,
        action: log.action,
        user: log.user_email || "System",
        entity: log.entity_type || "Unknown",
        timestamp: log.created_at,
        details: log.changes,
      }));
      this.setCache(cacheKey, activities);
      return activities;
    } catch (error) {
      console.error("Failed to fetch recent activities:", error);
      return [];
    }
  }

  async getPendingApprovals(): Promise<PendingApproval[]> {
    const cacheKey = "pending_approvals";
    const cached = this.getFromCache<PendingApproval[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get("/superadmin/colleges/requests/pending");
      const colleges = response.data?.data || [];
      const approvals: PendingApproval[] = colleges.map((college: any) => ({
        id: college.id,
        name: college.name,
        email: college.email,
        type: "College",
        date: college.created_at,
        link: `/app/superadmin/colleges/${college.id}`,
      }));
      this.setCache(cacheKey, approvals);
      return approvals;
    } catch (error) {
      console.error("Failed to fetch pending approvals:", error);
      return [];
    }
  }

  async getMostActiveColleges(limit: number = 5): Promise<MostActiveCollege[]> {
    const cacheKey = "most_active_colleges";
    const cached = this.getFromCache<MostActiveCollege[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get("/superadmin/analytics/colleges");
      const colleges = response.data?.data || [];
      const active: MostActiveCollege[] = colleges
        .sort((a: any, b: any) => (b.studentCount || 0) - (a.studentCount || 0))
        .slice(0, limit)
        .map((college: any) => ({
          id: college.id,
          name: college.name,
          studentCount: college.studentCount || 0,
          activityScore: college.activityScore || 0,
        }));
      this.setCache(cacheKey, active);
      return active;
    } catch (error) {
      console.error("Failed to fetch most active colleges:", error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default new SuperAdminMetricsService();

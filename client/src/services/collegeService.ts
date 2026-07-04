import api from "../lib/api";

export interface College {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  status: "active" | "pending" | "suspended";
  students: number;
  admins: number;
  createdAt: string;
}

export interface CreateCollegeInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  tpoName: string;
  tpoEmail: string;
  studentLimit: number;
}

export interface CollegeRequest {
  id: string;
  name: string;
  contact: string;
  email: string;
  city: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

class CollegeService {
  /**
   * Get all colleges with pagination and filtering
   */
  async getAllColleges(
    status?: string,
    search?: string,
    page = 1,
    limit = 50
  ): Promise<{ colleges: College[]; total: number }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      const response = await api.get(`/superadmin/colleges?${params}`);
      return response.data?.data || { colleges: [], total: 0 };
    } catch (error) {
      console.error("Failed to fetch colleges:", error);
      throw error;
    }
  }

  /**
   * Get single college details
   */
  async getCollege(id: string): Promise<College> {
    try {
      const response = await api.get(`/superadmin/colleges/${id}`);
      return response.data?.data;
    } catch (error) {
      console.error(`Failed to fetch college ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new college
   */
  async createCollege(data: CreateCollegeInput): Promise<College> {
    try {
      const response = await api.post("/superadmin/colleges", data);
      return response.data?.data;
    } catch (error) {
      console.error("Failed to create college:", error);
      throw error;
    }
  }

  /**
   * Update college
   */
  async updateCollege(id: string, data: Partial<CreateCollegeInput>): Promise<College> {
    try {
      const response = await api.put(`/superadmin/colleges/${id}`, data);
      return response.data?.data;
    } catch (error) {
      console.error(`Failed to update college ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get pending college requests
   */
  async getPendingRequests(): Promise<CollegeRequest[]> {
    try {
      const response = await api.get("/superadmin/colleges/requests");
      return response.data?.data || [];
    } catch (error) {
      console.error("Failed to fetch college requests:", error);
      throw error;
    }
  }

  /**
   * Approve college registration
   */
  async approveCollege(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/superadmin/colleges/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Failed to approve college ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reject college registration
   */
  async rejectCollege(
    id: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/superadmin/colleges/${id}/reject`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to reject college ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete college (soft delete)
   */
  async deleteCollege(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/superadmin/colleges/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete college ${id}:`, error);
      throw error;
    }
  }
}

export default new CollegeService();

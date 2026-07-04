import api from "../lib/api";

export interface Permission {
  id: string;
  name: string;
  description: string;
  category?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
  permissions?: Permission[];
}

class RoleService {
  /**
   * List all roles
   */
  async listRoles(): Promise<Role[]> {
    try {
      const response = await api.get("/superadmin/roles");
      return response.data?.data || [];
    } catch (error) {
      console.error("Failed to list roles:", error);
      throw error;
    }
  }

  /**
   * Get single role with permissions
   */
  async getRole(roleId: string): Promise<Role> {
    try {
      const response = await api.get(`/superadmin/roles/${roleId}`);
      return response.data?.data;
    } catch (error) {
      console.error(`Failed to get role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Create new role
   */
  async createRole(data: {
    name: string;
    description?: string;
  }): Promise<Role> {
    try {
      const response = await api.post("/superadmin/roles", data);
      return response.data?.data;
    } catch (error) {
      console.error("Failed to create role:", error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(
    roleId: string,
    data: { name?: string; description?: string }
  ): Promise<Role> {
    try {
      const response = await api.put(`/superadmin/roles/${roleId}`, data);
      return response.data?.data;
    } catch (error) {
      console.error(`Failed to update role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/superadmin/roles/${roleId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<Record<string, Permission[]>> {
    try {
      const response = await api.get("/superadmin/roles/permissions");
      return response.data?.data || {};
    } catch (error) {
      console.error("Failed to get permissions:", error);
      throw error;
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(
    roleId: string,
    permissionIds: string[]
  ): Promise<{ success: boolean; message: string; permissions_count: number }> {
    try {
      const response = await api.put(
        `/superadmin/roles/${roleId}/permissions`,
        { permission_ids: permissionIds }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update permissions for role ${roleId}:`, error);
      throw error;
    }
  }
}

export default new RoleService();

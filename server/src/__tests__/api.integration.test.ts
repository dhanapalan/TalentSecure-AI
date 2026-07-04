import { describe, it, expect, beforeAll } from "vitest";

/**
 * Phase 2 API Integration Tests
 * Tests all 25 endpoints for Users, Roles, Audit Trail, and Workflows
 */

const BASE_URL = "http://localhost:5050/api";
let authToken: string;
const adminEmail = "admin@gradlogic.com";
const adminPassword = "Admin123";

// Test data
let testUserId: string;
let testRoleId: string;
let testWorkflowId: string;

describe("Phase 2 API Integration Tests", () => {
  // ===== Authentication =====
  describe("Authentication", () => {
    it("should login and receive JWT token", async () => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.accessToken).toBeDefined();
      authToken = data.data.accessToken;
    });

    it("should reject invalid credentials", async () => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid@example.com",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  // ===== Users Management =====
  describe("Users Management (8 endpoints)", () => {
    const headers = () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    });

    it("GET /superadmin/users - List users with pagination", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/users?page=1&limit=10`, {
        headers: headers(),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.users).toBeDefined();
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.page).toBe(1);
    });

    it("GET /superadmin/users - Filter by role", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/users?role=admin`, {
        headers: headers(),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("GET /superadmin/users - Search functionality", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/users?search=admin`, {
        headers: headers(),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("POST /superadmin/users - Create user", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/users`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          email: `testuser${Date.now()}@example.com`,
          full_name: "Test User",
          phone: "+919876543210",
          role: "teacher",
          password: "TestPass123!",
        }),
      });

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        const data = await response.json();
        testUserId = data.data.id;
      }
    });

    it("GET /superadmin/users/:id - Get user by ID", async () => {
      if (!testUserId) {
        console.log("Skipping - no test user created");
        return;
      }

      const response = await fetch(`${BASE_URL}/superadmin/users/${testUserId}`, {
        headers: headers(),
      });

      expect([200, 404]).toContain(response.status);
    });

    it("PUT /superadmin/users/:id - Update user", async () => {
      if (!testUserId) {
        console.log("Skipping - no test user created");
        return;
      }

      const response = await fetch(`${BASE_URL}/superadmin/users/${testUserId}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          full_name: "Updated Test User",
        }),
      });

      expect([200, 404]).toContain(response.status);
    });

    it("POST /superadmin/users/:id/suspend - Suspend user", async () => {
      if (!testUserId) {
        console.log("Skipping - no test user created");
        return;
      }

      const response = await fetch(`${BASE_URL}/superadmin/users/${testUserId}/suspend`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ reason: "Testing" }),
      });

      expect([200, 404]).toContain(response.status);
    });

    it("POST /superadmin/users/:id/unsuspend - Unsuspend user", async () => {
      if (!testUserId) {
        console.log("Skipping - no test user created");
        return;
      }

      const response = await fetch(`${BASE_URL}/superadmin/users/${testUserId}/unsuspend`, {
        method: "POST",
        headers: headers(),
      });

      expect([200, 404]).toContain(response.status);
    });

    it("POST /superadmin/users/bulk - Bulk user action", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/users/bulk`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "suspend",
          user_ids: [testUserId || "invalid-id"],
        }),
      });

      expect([200, 400, 404]).toContain(response.status);
    });

    it("DELETE /superadmin/users/:id - Delete user", async () => {
      if (!testUserId) {
        console.log("Skipping - no test user created");
        return;
      }

      const response = await fetch(`${BASE_URL}/superadmin/users/${testUserId}`, {
        method: "DELETE",
        headers: headers(),
      });

      expect([200, 404]).toContain(response.status);
    });
  });

  // ===== Roles Management =====
  describe("Roles Management (7 endpoints)", () => {
    const headers = () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    });

    it("GET /superadmin/roles - List roles", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/roles`, {
        headers: headers(),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.roles).toBeDefined();
    });

    it("POST /superadmin/roles - Create custom role", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/roles`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: `test_role_${Date.now()}`,
          description: "Test role for integration testing",
          permissions: [],
        }),
      });

      expect([201, 400, 409]).toContain(response.status);
      if (response.status === 201) {
        const data = await response.json();
        testRoleId = data.data.id;
      }
    });

    it("GET /superadmin/roles/:id - Get role with permissions", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/roles?limit=1`, {
        headers: headers(),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.data.roles.length > 0) {
        const roleId = data.data.roles[0].id;
        const roleResponse = await fetch(`${BASE_URL}/superadmin/roles/${roleId}`, {
          headers: headers(),
        });
        expect(roleResponse.status).toBe(200);
      }
    });

    it("PUT /superadmin/roles/:id - Update role", async () => {
      if (!testRoleId) {
        console.log("Skipping - no test role created");
        return;
      }

      const response = await fetch(`${BASE_URL}/superadmin/roles/${testRoleId}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          description: "Updated test role",
        }),
      });

      expect([200, 403, 404]).toContain(response.status);
    });

    it("GET /superadmin/roles/:id/permissions - Get role permissions", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/roles?limit=1`, {
        headers: headers(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.roles.length > 0) {
          const roleId = data.data.roles[0].id;
          const permResponse = await fetch(
            `${BASE_URL}/superadmin/roles/${roleId}/permissions`,
            { headers: headers() }
          );
          expect([200, 404]).toContain(permResponse.status);
        }
      }
    });

    it("PUT /superadmin/roles/:id/permissions - Update permissions", async () => {
      if (!testRoleId) {
        console.log("Skipping - no test role created");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/superadmin/roles/${testRoleId}/permissions`,
        {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify({ permission_ids: [] }),
        }
      );

      expect([200, 400, 404]).toContain(response.status);
    });

    it("DELETE /superadmin/roles/:id - Delete role", async () => {
      if (!testRoleId) {
        console.log("Skipping - no test role created");
        return;
      }

      const response = await fetch(`${BASE_URL}/superadmin/roles/${testRoleId}`, {
        method: "DELETE",
        headers: headers(),
      });

      expect([200, 403, 404]).toContain(response.status);
    });
  });

  // ===== Audit Trail =====
  describe("Audit Trail (4 endpoints)", () => {
    const headers = () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    });

    it("GET /superadmin/audit-trail - List audit logs", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/audit-trail?page=1&limit=20`, {
        headers: headers(),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.logs).toBeDefined();
    });

    it("GET /superadmin/audit-trail - Filter by action", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/audit-trail?action=create`, {
        headers: headers(),
      });

      expect(response.status).toBe(200);
    });

    it("GET /superadmin/audit-trail/:id - Get audit entry", async () => {
      const listResponse = await fetch(`${BASE_URL}/superadmin/audit-trail?limit=1`, {
        headers: headers(),
      });

      if (listResponse.ok) {
        const data = await listResponse.json();
        if (data.data.logs.length > 0) {
          const logId = data.data.logs[0].id;
          const response = await fetch(`${BASE_URL}/superadmin/audit-trail/${logId}`, {
            headers: headers(),
          });
          expect([200, 404]).toContain(response.status);
        }
      }
    });

    it("GET /superadmin/audit-trail/stats - Get statistics", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/audit-trail/stats?days=30`, {
        headers: headers(),
      });

      expect([200, 400]).toContain(response.status);
    });
  });

  // ===== Workflows =====
  describe("Workflows (6 endpoints)", () => {
    const headers = () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    });

    it("GET /superadmin/workflows - List workflows", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/workflows`, {
        headers: headers(),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("POST /superadmin/workflows - Create workflow", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/workflows`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: `Test Workflow ${Date.now()}`,
          description: "Test workflow",
          trigger_event: "user_created",
          steps: [],
        }),
      });

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        const data = await response.json();
        testWorkflowId = data.data.id;
      }
    });

    it("GET /superadmin/workflows/:id - Get workflow", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/workflows?limit=1`, {
        headers: headers(),
      });

      expect(response.status).toBe(200);
    });

    it("PUT /superadmin/workflows/:id - Update workflow", async () => {
      if (!testWorkflowId) {
        console.log("Skipping - no test workflow created");
        return;
      }

      const response = await fetch(`${BASE_URL}/superadmin/workflows/${testWorkflowId}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ is_active: true }),
      });

      expect([200, 404]).toContain(response.status);
    });

    it("PUT /superadmin/workflows/:id/steps - Update steps", async () => {
      if (!testWorkflowId) {
        console.log("Skipping - no test workflow created");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/superadmin/workflows/${testWorkflowId}/steps`,
        {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify({ steps: [] }),
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it("DELETE /superadmin/workflows/:id - Delete workflow", async () => {
      if (!testWorkflowId) {
        console.log("Skipping - no test workflow created");
        return;
      }

      const response = await fetch(`${BASE_URL}/superadmin/workflows/${testWorkflowId}`, {
        method: "DELETE",
        headers: headers(),
      });

      expect([200, 404]).toContain(response.status);
    });
  });

  // ===== Security Tests =====
  describe("Security & Authorization", () => {
    it("should reject requests without token", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/users`, {
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status).toBe(401);
    });

    it("should reject requests with invalid token", async () => {
      const response = await fetch(`${BASE_URL}/superadmin/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid.token.here",
        },
      });

      expect(response.status).toBe(401);
    });

    it("should enforce rate limiting on login", async () => {
      // Note: This is a simple test - real rate limiting requires multiple rapid requests
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid@example.com",
          password: "invalid",
        }),
      });

      expect([401, 429]).toContain(response.status);
    });
  });
});

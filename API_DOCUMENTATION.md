# TalentSecure Phase 2 API Documentation

**Version**: 2.0.0  
**Base URL**: `http://localhost:5050/api`  
**Authentication**: Bearer Token (JWT)

---

## 📋 Overview

Phase 2 API provides 25 endpoints across 4 feature areas:
- **Users Management** (8 endpoints)
- **Roles Management** (7 endpoints)
- **Audit Trail** (4 endpoints)
- **Workflows** (6 endpoints)

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## 🔐 Authentication

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "admin@gradlogic.com",
  "password": "Admin123"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "admin@gradlogic.com",
      "role": "super_admin",
      "name": "Super Admin"
    }
  }
}
```

---

## 👥 Users Management (8 endpoints)

### 1. List Users
```
GET /superadmin/users
Query Params:
  - page: number (default: 1)
  - limit: number (default: 50)
  - search: string (name, email, phone, college)
  - role: string (admin | college_admin | teacher | student | super_admin)
  - status: string (active | inactive | suspended)
  - college_id: uuid
  - from_date: ISO date
  - to_date: ISO date

Response (200):
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone": "+91...",
        "role": "admin",
        "status": "active",
        "college_id": "uuid",
        "college_name": "MIT",
        "created_at": "2026-07-04T...",
        "updated_at": "2026-07-04T...",
        "last_login": "2026-07-04T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

### 2. Get User
```
GET /superadmin/users/:id

Response (200): Single user object
Response (404): User not found
```

### 3. Create User
```
POST /superadmin/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "full_name": "Jane Doe",
  "phone": "+91...",
  "role": "admin",
  "password": "SecurePass123!",
  "college_id": "uuid"
}

Response (201): Created user object
Response (400): Validation error
Response (409): Email already exists
```

### 4. Update User
```
PUT /superadmin/users/:id
Content-Type: application/json

{
  "full_name": "Jane Smith",
  "phone": "+91...",
  "email": "jane@example.com",
  "role": "college_admin"
}

Response (200): Updated user object
Response (404): User not found
```

### 5. Delete User (Soft Delete)
```
DELETE /superadmin/users/:id

Response (200): { "success": true, "message": "User deleted" }
Response (404): User not found
```

### 6. Suspend User
```
POST /superadmin/users/:id/suspend
Body: { "reason": "Policy violation" }

Response (200): { "success": true, "message": "User suspended" }
Response (404): User not found
```

### 7. Unsuspend User
```
POST /superadmin/users/:id/unsuspend

Response (200): { "success": true, "message": "User unsuspended" }
Response (404): User not found
```

### 8. Bulk User Action
```
POST /superadmin/users/bulk
Content-Type: application/json

{
  "action": "delete | suspend | unsuspend | change_role",
  "user_ids": ["uuid1", "uuid2", "uuid3"],
  "data": {
    "role": "teacher" // for change_role action
  }
}

Response (200): { "success": true, "message": "3 users updated" }
Response (400): Invalid action
```

---

## 🔐 Roles Management (7 endpoints)

### 1. List Roles
```
GET /superadmin/roles
Query Params:
  - page: number (default: 1)
  - limit: number (default: 50)
  - search: string (role name)

Response (200):
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "uuid",
        "name": "custom_auditor",
        "description": "Can view audit logs",
        "is_system": false,
        "user_count": 5,
        "created_at": "2026-07-04T...",
        "updated_at": "2026-07-04T..."
      }
    ],
    "pagination": { ... }
  }
}
```

### 2. Get Role with Permissions
```
GET /superadmin/roles/:id

Response (200):
{
  "success": true,
  "data": {
    "role": {
      "id": "uuid",
      "name": "custom_auditor",
      "description": "...",
      "is_system": false,
      "permissions": [
        {
          "id": "uuid",
          "name": "audit_view",
          "category": "audit",
          "description": "View audit logs"
        }
      ]
    }
  }
}
```

### 3. Create Role
```
POST /superadmin/roles
Content-Type: application/json

{
  "name": "data_analyst",
  "description": "Can view analytics and reports",
  "permissions": ["analytics_view", "report_export"]
}

Response (201): Created role object
Response (400): Invalid role name
Response (409): Role already exists
```

### 4. Update Role
```
PUT /superadmin/roles/:id
Content-Type: application/json

{
  "description": "Updated description",
  "name": "data_analyst_updated"
}

Response (200): Updated role object
Response (403): Cannot modify system roles
Response (404): Role not found
```

### 5. Delete Role (Custom Roles Only)
```
DELETE /superadmin/roles/:id

Response (200): { "success": true, "message": "Role deleted" }
Response (403): Cannot delete system roles
Response (404): Role not found
```

### 6. Get Role Permissions
```
GET /superadmin/roles/:id/permissions

Response (200):
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "uuid",
        "name": "users_manage",
        "category": "users",
        "description": "Create, update, delete users"
      }
    ]
  }
}
```

### 7. Update Role Permissions
```
PUT /superadmin/roles/:id/permissions
Content-Type: application/json

{
  "permission_ids": ["uuid1", "uuid2", "uuid3"]
}

Response (200): { "success": true, "message": "Permissions updated" }
Response (400): Invalid permissions
Response (404): Role not found
```

---

## 📋 Audit Trail (4 endpoints)

### 1. List Audit Logs
```
GET /superadmin/audit-trail
Query Params:
  - page: number (default: 1)
  - limit: number (default: 50)
  - action: string (create|update|delete|read|export)
  - resource_type: string (users|roles|audit_logs|workflows)
  - severity: string (info|warning|error|critical)
  - actor_id: uuid
  - date_from: ISO date
  - date_to: ISO date

Response (200):
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "actor_id": "uuid",
        "actor_email": "admin@gradlogic.com",
        "action": "create",
        "resource_type": "users",
        "resource_id": "uuid",
        "changes": { "email": "new@example.com" },
        "severity": "info",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "metadata": { "source": "web" },
        "created_at": "2026-07-04T..."
      }
    ],
    "pagination": { ... }
  }
}
```

### 2. Get Audit Entry
```
GET /superadmin/audit-trail/:id

Response (200): Single audit log object
Response (404): Audit entry not found
```

### 3. Get Audit Statistics
```
GET /superadmin/audit-trail/stats?days=30

Response (200):
{
  "success": true,
  "data": {
    "period": "2026-06-04 to 2026-07-04",
    "total_actions": 1250,
    "by_action": {
      "create": 450,
      "update": 600,
      "delete": 150,
      "read": 50
    },
    "by_resource": {
      "users": 800,
      "roles": 250,
      "workflows": 200
    },
    "by_severity": {
      "info": 1200,
      "warning": 40,
      "error": 10,
      "critical": 0
    },
    "by_actor": [
      {
        "actor_email": "admin@gradlogic.com",
        "action_count": 500
      }
    ]
  }
}
```

### 4. Export Audit Logs
```
POST /superadmin/audit-trail/export
Content-Type: application/json

{
  "format": "csv | json | pdf",
  "filters": {
    "date_from": "2026-06-01",
    "date_to": "2026-07-04",
    "action": "create",
    "resource_type": "users"
  }
}

Response (200): File download
  Content-Type: application/csv or application/json
  Content-Disposition: attachment; filename="audit_logs_2026-07-04.csv"
```

---

## 🔄 Workflows (6 endpoints)

### 1. List Workflows
```
GET /superadmin/workflows
Query Params:
  - page: number (default: 1)
  - limit: number (default: 50)
  - search: string (workflow name)
  - status: string (active|inactive|draft)

Response (200):
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "uuid",
        "name": "User Onboarding",
        "description": "Automatic user setup workflow",
        "trigger_event": "user_created",
        "is_active": true,
        "step_count": 5,
        "execution_count": 234,
        "last_executed": "2026-07-04T10:30:00Z",
        "created_at": "2026-07-04T...",
        "updated_at": "2026-07-04T..."
      }
    ],
    "pagination": { ... }
  }
}
```

### 2. Get Workflow
```
GET /superadmin/workflows/:id

Response (200):
{
  "success": true,
  "data": {
    "workflow": {
      "id": "uuid",
      "name": "User Onboarding",
      "description": "...",
      "trigger_event": "user_created",
      "is_active": true,
      "steps": [
        {
          "id": "uuid",
          "order": 1,
          "type": "send_email",
          "config": { "template": "welcome" },
          "condition": null
        },
        {
          "id": "uuid",
          "order": 2,
          "type": "create_task",
          "config": { "title": "Complete profile" },
          "condition": { "field": "role", "operator": "==", "value": "student" }
        }
      ]
    }
  }
}
```

### 3. Create Workflow
```
POST /superadmin/workflows
Content-Type: application/json

{
  "name": "User Onboarding",
  "description": "Automatic user setup workflow",
  "trigger_event": "user_created",
  "steps": [
    {
      "order": 1,
      "type": "send_email",
      "config": { "template": "welcome" }
    }
  ]
}

Response (201): Created workflow object
Response (400): Invalid workflow configuration
```

### 4. Update Workflow
```
PUT /superadmin/workflows/:id
Content-Type: application/json

{
  "name": "User Onboarding v2",
  "description": "...",
  "is_active": true
}

Response (200): Updated workflow object
Response (404): Workflow not found
```

### 5. Delete Workflow
```
DELETE /superadmin/workflows/:id

Response (200): { "success": true, "message": "Workflow deleted" }
Response (404): Workflow not found
```

### 6. Update Workflow Steps
```
PUT /superadmin/workflows/:id/steps
Content-Type: application/json

{
  "steps": [
    {
      "id": "uuid",
      "order": 1,
      "type": "send_email",
      "config": { "template": "welcome" }
    },
    {
      "order": 2,
      "type": "create_task",
      "config": { "title": "Complete profile" }
    }
  ]
}

Response (200): { "success": true, "message": "Steps updated" }
Response (404): Workflow not found
```

---

## 📊 Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

### Status Codes
- **200**: OK
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **500**: Internal Server Error

---

## 🔄 Pagination

All list endpoints support pagination:
```
Query params:
  - page: number (1-based, default: 1)
  - limit: number (max: 100, default: 50)

Response includes:
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔍 Filtering & Search

### Search
Most list endpoints support full-text search via `search` query param:
```
GET /superadmin/users?search=john
```
Searches across multiple fields (name, email, phone, etc.)

### Filtering
Endpoints support field-specific filters:
```
GET /superadmin/users?role=admin&status=active&college_id=uuid
```

### Date Range
Many endpoints support date filtering:
```
GET /superadmin/audit-trail?date_from=2026-06-01&date_to=2026-07-04
```

---

## 🛡️ Security & Audit Logging

- All mutations are audit-logged
- Soft deletes preserve data integrity
- JWT tokens expire after 7 days
- Failed login attempts are rate-limited
- All requests are CORS-protected

---

## 📝 Testing

### Get Token
```bash
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gradlogic.com","password":"Admin123"}'
```

### Use Token
```bash
curl -X GET http://localhost:5050/api/superadmin/users \
  -H "Authorization: Bearer eyJhbGc..."
```

### Test in Postman
1. Import the API collection (available at `/api/docs`)
2. Set Bearer token in Authorization tab
3. Test each endpoint

---

## 📚 Additional Resources

- **Swagger UI**: http://localhost:5050/api/docs
- **OpenAPI Spec**: http://localhost:5050/api/docs-json
- **Postman Collection**: [Download](./postman-collection.json)


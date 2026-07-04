# Phase 1 API Endpoints - Comprehensive Specification

## Existing Endpoints (Can Reuse)

### Question Bank
- `GET /api/question-bank` - List all questions
- `GET /api/question-bank/:id` - Get single question
- `POST /api/question-bank` - Create question
- `PUT /api/question-bank/:id` - Update question
- `DELETE /api/question-bank/:id` - Soft delete
- `GET /api/question-bank/categories` - Get category counts

### Colleges
- `GET /api/colleges/students` - List college students
- `POST /api/colleges/add-students` - Bulk add students
- `GET /api/colleges/stats` - Get college stats

## New Endpoints Needed for Phase 1 SuperAdmin

### SuperAdmin Platform Metrics (✅ Already Created)
```
GET /api/superadmin/metrics/platform
GET /api/superadmin/metrics/growth
GET /api/superadmin/metrics/alerts
```

### SuperAdmin Colleges Management
```
GET    /api/superadmin/colleges              - List all colleges with status
POST   /api/superadmin/colleges              - Create new college
GET    /api/superadmin/colleges/:id          - Get college details
PUT    /api/superadmin/colleges/:id          - Update college
DELETE /api/superadmin/colleges/:id          - Soft delete college

GET    /api/superadmin/colleges/requests     - Get pending college requests
POST   /api/superadmin/colleges/:id/approve  - Approve college registration
POST   /api/superadmin/colleges/:id/reject   - Reject college registration
```

### SuperAdmin Categories Management
```
GET    /api/superadmin/categories            - List all categories
POST   /api/superadmin/categories            - Create category
PUT    /api/superadmin/categories/:id        - Update category
DELETE /api/superadmin/categories/:id        - Delete category

POST   /api/superadmin/categories/:id/topics - Add topic to category
DELETE /api/superadmin/categories/:id/topics/:topicId - Delete topic
```

### SuperAdmin Question Bank
```
GET    /api/superadmin/question-bank         - List questions (reuse existing with filters)
POST   /api/superadmin/question-bank         - Create question (reuse existing)
PUT    /api/superadmin/question-bank/:id     - Update question (reuse existing)
DELETE /api/superadmin/question-bank/:id     - Delete question (reuse existing)
GET    /api/superadmin/question-bank/search  - Advanced search
```

### SuperAdmin Review Queue (AI Generated Questions)
```
GET    /api/superadmin/review-queue          - Get pending AI questions
GET    /api/superadmin/review-queue/:id      - Get single pending question
POST   /api/superadmin/review-queue/:id/approve - Approve AI question
POST   /api/superadmin/review-queue/:id/reject  - Reject AI question with reason
GET    /api/superadmin/review-queue/stats    - Review queue statistics
```

### SuperAdmin Notifications
```
GET    /api/superadmin/announcements         - List announcements
POST   /api/superadmin/announcements         - Create announcement
PUT    /api/superadmin/announcements/:id     - Update announcement
DELETE /api/superadmin/announcements/:id     - Delete announcement

GET    /api/superadmin/email-templates       - List email templates
POST   /api/superadmin/email-templates       - Create template
PUT    /api/superadmin/email-templates/:id   - Update template
DELETE /api/superadmin/email-templates/:id   - Delete template
```

## Request/Response Formats

### Create College Request
```json
{
  "name": "MIT College of Engineering",
  "email": "admin@mit.edu",
  "phone": "+91 9876543210",
  "address": "123 Main Street",
  "city": "Bangalore",
  "state": "Karnataka",
  "tpoName": "Dr. Rajesh Kumar",
  "tpoEmail": "tpo@mit.edu",
  "studentLimit": 200
}
```

### College Response
```json
{
  "id": "college-uuid",
  "name": "MIT College of Engineering",
  "email": "admin@mit.edu",
  "status": "active|pending|suspended",
  "city": "Bangalore",
  "students": 150,
  "admins": 3,
  "createdAt": "2026-07-04T00:00:00Z"
}
```

### Approve/Reject College
```json
POST /api/superadmin/colleges/{id}/approve
Response: { success: true, message: "College approved" }

POST /api/superadmin/colleges/{id}/reject
Body: { reason: "Does not meet criteria" }
Response: { success: true, message: "College rejected" }
```

### Create Announcement
```json
{
  "title": "Platform Maintenance",
  "message": "System maintenance scheduled for July 5th",
  "type": "info|warning|success|error"
}
```

### Approve/Reject Question
```json
POST /api/superadmin/review-queue/{id}/approve
Response: { success: true, message: "Question approved and published" }

POST /api/superadmin/review-queue/{id}/reject
Body: { reason: "Grammar errors in option B" }
Response: { success: true, message: "Question rejected" }
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden (role not allowed)
- 404: Not Found
- 409: Conflict (e.g., duplicate email)
- 500: Server Error

## Authentication

All endpoints require:
- JWT token in `Authorization: Bearer <token>` header
- User must have `super_admin` role
- (Some endpoints may allow `hr`, `admin` roles)

## Rate Limiting

- 100 requests per 15 minutes (global)
- 10 login attempts per 15 minutes

# Admin Testing Credentials

## 🔐 Super Admin Access

### Web Application
```
URL:      http://localhost:3000/app/superadmin/users
Email:    admin@gradlogic.com
Password: Admin123
```

### API Testing
```bash
# Get JWT Token
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gradlogic.com",
    "password": "Admin123"
  }'

# Response will include "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Use token in API calls
curl -X GET http://localhost:5050/api/superadmin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎯 What to Test

### Users Management Page
```
http://localhost:3000/app/superadmin/users

Features:
- List all users with pagination
- Search by name/email
- Filter by role/status
- Create new user
- Edit user details
- Suspend/unsuspend users
- Bulk operations (delete, change role)
```

### Roles Management Page
```
http://localhost:3000/app/superadmin/roles

Features:
- List all roles
- Create custom roles
- Edit permissions for roles
- View permission matrix
- Toggle role active/inactive
- System roles protected from deletion
```

### Audit Trail Page
```
http://localhost:3000/app/superadmin/audit-trail

Features:
- Timeline view of all system actions
- Filter by action/resource/date
- View 30-day statistics
- Export logs to CSV/JSON
- Detailed log viewer modal
```

### Workflows Page
```
http://localhost:3000/app/superadmin/workflows

Features:
- List all workflows
- Create workflow
- Configure workflow steps
- Set up conditional logic
- Toggle active/inactive
- View workflow statistics
```

## 📊 API Endpoints Available

All 25 endpoints are operational and require JWT token authentication:

### Users Management (8 endpoints)
```
GET    /api/superadmin/users
GET    /api/superadmin/users/:id
POST   /api/superadmin/users
PUT    /api/superadmin/users/:id
DELETE /api/superadmin/users/:id
POST   /api/superadmin/users/bulk
POST   /api/superadmin/users/:id/suspend
POST   /api/superadmin/users/:id/unsuspend
```

### Roles Management (7 endpoints)
```
GET    /api/superadmin/roles
GET    /api/superadmin/roles/:id
POST   /api/superadmin/roles
PUT    /api/superadmin/roles/:id
DELETE /api/superadmin/roles/:id
GET    /api/superadmin/roles/:id/permissions
PUT    /api/superadmin/roles/:id/permissions
```

### Audit Trail (4 endpoints)
```
GET    /api/superadmin/audit-trail
GET    /api/superadmin/audit-trail/:id
GET    /api/superadmin/audit-trail/stats
POST   /api/superadmin/audit-trail/export
```

### Workflows (6 endpoints)
```
GET    /api/superadmin/workflows
GET    /api/superadmin/workflows/:id
POST   /api/superadmin/workflows
PUT    /api/superadmin/workflows/:id
DELETE /api/superadmin/workflows/:id
PUT    /api/superadmin/workflows/:id/steps
```

## 🚀 Quick Testing Checklist

- [ ] Login to admin portal
- [ ] Navigate to Users page
- [ ] View list of users
- [ ] Create new user
- [ ] Test search functionality
- [ ] Navigate to Roles page
- [ ] Create custom role
- [ ] Edit role permissions
- [ ] Check Audit Trail
- [ ] View audit statistics
- [ ] Navigate to Workflows
- [ ] Create workflow
- [ ] All pages responsive and performant

## 📱 Access Points

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| API Server | http://localhost:5050 | 5050 |
| Database | localhost:5433 | 5433 |
| Redis | localhost:6380 | 6380 |
| MinIO | http://localhost:9000 | 9000 |

## ⚠️ Important Notes

- **Password**: `Admin123` (bcrypt hashed in database)
- **Role**: `super_admin` (full access to all admin features)
- **JWT Token**: Required for all API calls (Bearer token in Authorization header)
- **Token Expiry**: Set as configured in auth service
- **HTTPS**: Not enabled in staging (development only)

## 🔄 If Password Needs Reset

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d talentsecure -p 5433

# Update password hash (replace with new bcrypt hash)
UPDATE users 
SET password_hash = 'new_bcrypt_hash_here'
WHERE email = 'admin@gradlogic.com';
```

---

**Status**: ✅ **Admin Account Ready for Testing**  
**Deployment**: ✅ **All Services Running**  
**Ready for**: Phase 2.1 Integration Testing  


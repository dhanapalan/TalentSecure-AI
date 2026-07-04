-- TalentSecure Phase 2 Performance Optimization
-- Add indexes, optimize queries, and improve response times

-- ===== Users Table Indexes =====
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_college_role ON users(college_id, role)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at DESC);

-- ===== Audit Trail Indexes =====
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action ON audit_logs(actor_id, action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity)
  WHERE severity IN ('warning', 'error', 'critical');

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_date ON audit_logs(action, created_at DESC);

-- ===== Workflows Table Indexes =====
CREATE INDEX IF NOT EXISTS idx_workflows_active_created ON workflows(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflows_trigger_event ON workflows(trigger_event);

CREATE INDEX IF NOT EXISTS idx_workflows_name ON workflows(name)
  WHERE deleted_at IS NULL;

-- ===== Roles Indexes =====
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system);

-- ===== Roles Permissions Junction =====
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ===== Query Optimization Views =====

-- View for active users with roles (commonly queried)
CREATE OR REPLACE VIEW active_users_view AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.phone,
  u.role,
  u.is_active,
  u.created_at,
  u.last_login,
  c.id as college_id,
  c.name as college_name
FROM users u
LEFT JOIN colleges c ON u.college_id = c.id
WHERE u.deleted_at IS NULL AND u.is_active = true;

-- View for audit stats (for quick dashboard queries)
CREATE OR REPLACE VIEW audit_stats_view AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  action,
  resource_type,
  severity,
  COUNT(*) as count
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), action, resource_type, severity;

-- ===== Column Statistics for Query Planner =====

ANALYZE users;
ANALYZE audit_logs;
ANALYZE workflows;
ANALYZE roles;
ANALYZE role_permissions;

-- ===== Connection Pooling Configuration =====

-- Note: These settings should be configured in the application connection pool
-- Min pool size: 5
-- Max pool size: 20
-- Connection timeout: 30 seconds
-- Idle timeout: 900 seconds (15 minutes)

-- ===== Redis Caching Strategy =====

-- Cache Keys Pattern:
-- users:list:{page}:{limit}:{filters_hash} -> 5 minute TTL
-- users:{id} -> 10 minute TTL
-- roles:list -> 30 minute TTL
-- audit:stats:{days} -> 1 hour TTL
-- workflows:list -> 15 minute TTL

-- ===== Query Optimization Tips =====

-- 1. Use LIMIT with pagination (already implemented)
-- 2. Always filter by deleted_at IS NULL
-- 3. Use indexes for WHERE, JOIN, and ORDER BY clauses
-- 4. Fetch only needed columns (no SELECT *)
-- 5. Cache common queries in Redis

-- ===== Performance Monitoring Queries =====

-- Find slow queries
SELECT query, mean_exec_time, max_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index sizes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check missing indexes
SELECT *
FROM pg_stat_user_tables
WHERE seq_scan > 100 AND idx_scan = 0
ORDER BY seq_scan DESC;

-- ===== Maintenance Tasks =====

-- Run periodically (daily/weekly):
VACUUM ANALYZE;

-- Clean up old audit logs (monthly):
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days'
  AND severity = 'info';

-- Update table statistics:
ANALYZE users;
ANALYZE audit_logs;
ANALYZE workflows;

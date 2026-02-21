// =============================================================================
// TalentSecure AI — Audit Logging Service
// =============================================================================
// Logs security-relevant actions: exam resets, student creation, campus changes,
// role changes, login events, permission failures, etc.
// Each log includes: actor, action, timestamp, target entity, metadata.
// =============================================================================

import { query, queryOne } from "../config/database.js";
import { logger } from "../config/logger.js";
import { AdminAuditAction } from "../types/index.js";
import { v4 as uuidv4 } from "uuid";

// ── Audit Log Entry ──────────────────────────────────────────────────────────

export interface AuditLogEntry {
  actor_id: string;           // userId of the person performing the action
  actor_role: string;         // role of the actor
  actor_email?: string;       // email of the actor (for login events)
  action: AdminAuditAction;   // what happened
  target_type?: string;       // "student" | "campus" | "exam" | "user" | "role" | "session"
  target_id?: string;         // UUID of target entity
  exam_id?: string;           // exam context (if applicable)
  student_id?: string;        // student context (if applicable)
  reason?: string;            // human-readable reason for audit trail
  metadata?: Record<string, unknown>; // additional context (IP, user-agent, etc.)
  ip_address?: string;
}

// ── Ensure audit_logs table exists ───────────────────────────────────────────

export async function ensureAuditTable(): Promise<void> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS rbac_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id UUID,
        actor_role VARCHAR(50) NOT NULL,
        actor_email VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id UUID,
        exam_id UUID,
        student_id UUID,
        reason TEXT,
        metadata JSONB DEFAULT '{}',
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_rbac_audit_actor ON rbac_audit_logs(actor_id);
      CREATE INDEX IF NOT EXISTS idx_rbac_audit_action ON rbac_audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_rbac_audit_created ON rbac_audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_rbac_audit_target ON rbac_audit_logs(target_type, target_id);
    `);
    logger.info("✓ RBAC audit_logs table ready");
  } catch (err) {
    logger.error("Failed to ensure rbac_audit_logs table:", err);
  }
}

// ── Write Audit Log ──────────────────────────────────────────────────────────

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const id = uuidv4();
    await queryOne(
      `INSERT INTO rbac_audit_logs
        (id, actor_id, actor_role, actor_email, action, target_type, target_id,
         exam_id, student_id, reason, metadata, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        id,
        entry.actor_id || null,
        entry.actor_role,
        entry.actor_email || null,
        entry.action,
        entry.target_type || null,
        entry.target_id || null,
        entry.exam_id || null,
        entry.student_id || null,
        entry.reason || null,
        JSON.stringify(entry.metadata || {}),
        entry.ip_address || null,
      ],
    );
  } catch (err) {
    // Never let audit failures break the application
    logger.error("Audit log write failed:", err);
  }
}

// ── Convenience Helpers ──────────────────────────────────────────────────────

/** Log a permission denied event */
export async function logPermissionDenied(
  req: { user?: { userId: string; email: string; role: string }; ip?: string; originalUrl?: string; method?: string },
): Promise<void> {
  await writeAuditLog({
    actor_id: req.user?.userId || "anonymous",
    actor_role: req.user?.role || "unknown",
    actor_email: req.user?.email,
    action: "PERMISSION_DENIED",
    reason: `${req.method} ${req.originalUrl}`,
    ip_address: req.ip,
    metadata: { method: req.method, path: req.originalUrl },
  });
}

/** Log a successful login */
export async function logLogin(
  userId: string, email: string, role: string, ip?: string,
): Promise<void> {
  await writeAuditLog({
    actor_id: userId,
    actor_role: role,
    actor_email: email,
    action: "LOGIN_SUCCESS",
    ip_address: ip,
  });
}

/** Log a failed login */
export async function logLoginFailure(
  email: string, ip?: string, reason?: string,
): Promise<void> {
  await writeAuditLog({
    actor_id: "anonymous",
    actor_role: "unknown",
    actor_email: email,
    action: "LOGIN_FAILURE",
    reason: reason || "Invalid credentials",
    ip_address: ip,
  });
}

// ── Query Audit Logs ─────────────────────────────────────────────────────────

export interface AuditLogQuery {
  actor_id?: string;
  action?: AdminAuditAction;
  target_type?: string;
  target_id?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export async function queryAuditLogs(filters: AuditLogQuery = {}) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.actor_id) {
    conditions.push(`actor_id = $${paramIdx++}`);
    params.push(filters.actor_id);
  }
  if (filters.action) {
    conditions.push(`action = $${paramIdx++}`);
    params.push(filters.action);
  }
  if (filters.target_type) {
    conditions.push(`target_type = $${paramIdx++}`);
    params.push(filters.target_type);
  }
  if (filters.target_id) {
    conditions.push(`target_id = $${paramIdx++}`);
    params.push(filters.target_id);
  }
  if (filters.from) {
    conditions.push(`created_at >= $${paramIdx++}`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`created_at <= $${paramIdx++}`);
    params.push(filters.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  params.push(limit, offset);

  const rows = await query(
    `SELECT * FROM rbac_audit_logs ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    params as any[],
  );

  return rows;
}

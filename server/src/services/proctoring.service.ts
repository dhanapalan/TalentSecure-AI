import { query, queryOne } from "../config/database.js";

// Define weighted scores for different event types
const EVENT_WEIGHTS: Record<string, number> = {
    TAB_SWITCH: 2,
    WINDOW_BLUR: 2,
    COPY_ATTEMPT: 3,
    PASTE_ATTEMPT: 3,
    RIGHT_CLICK: 1,
    DEVTOOLS_OPEN: 5,
    FULLSCREEN_EXIT: 2,
    NETWORK_DISCONNECT: 1,
    FACE_NOT_DETECTED: 4,
    MULTIPLE_FACES: 8,
    FACE_MISMATCH: 10,
    TIME_TAMPER_ATTEMPT: 10,
    mobile_detected: 15, // AI Engine Label
    multiple_faces: 8,   // AI Engine Label
    suspicious: 5        // AI Engine Label
};

// Auto-termination thresholds
const TERMINATION_THRESHOLD = 50;
const CRITICAL_EVENTS = ["FACE_MISMATCH", "TIME_TAMPER_ATTEMPT", "mobile_detected"];

export const proctoringService = {
    /**
     * Log a proctoring event async (does not block standard exam flow)
     */
    async logEvent(sessionId: string, eventType: string, metadata?: any) {
        await query(
            `INSERT INTO proctoring_events (session_id, event_type, metadata)
             VALUES ($1, $2, $3)`,
            [sessionId, eventType, JSON.stringify(metadata || {})]
        );

        // Trigger async scoring evaluation (don't await to keep endpoint fast)
        this.evaluateIntegrity(sessionId).catch(err => {
            console.error(`Scoring error for session ${sessionId}:`, err);
        });

        return { success: true };
    },

    /**
     * Calculates session integrity score based on all logged events
     */
    async evaluateIntegrity(sessionId: string) {
        const events = await query<{ event_type: string }>(
            `SELECT event_type FROM proctoring_events WHERE session_id = $1`,
            [sessionId]
        );

        let totalPenalty = 0;
        let hasCriticalEvent = false;

        for (const event of events) {
            const weight = EVENT_WEIGHTS[event.event_type] || 0;
            totalPenalty += weight;
            if (CRITICAL_EVENTS.includes(event.event_type)) {
                hasCriticalEvent = true;
            }
        }

        let newScore = Math.max(0, 100 - totalPenalty);

        let riskLevel = "low";
        if (newScore < 50 || hasCriticalEvent) riskLevel = "high";
        else if (newScore < 80) riskLevel = "medium";

        await query(
            `UPDATE drive_students
             SET integrity_score = $1, violations = $2
             WHERE id = $3`,
            [newScore, events.length, sessionId]
        );

        if (riskLevel === "high" || riskLevel === "medium") {
            const existing = await queryOne<{ id: string }>(
                `SELECT id FROM proctoring_incidents WHERE session_id = $1 LIMIT 1`,
                [sessionId]
            );

            if (existing) {
                await query(
                    `UPDATE proctoring_incidents
                     SET score = $1, risk_level = $2, updated_at = NOW()
                     WHERE id = $3`,
                    [newScore, riskLevel, existing.id]
                );
            } else {
                await query(
                    `INSERT INTO proctoring_incidents (session_id, score, risk_level, status)
                     VALUES ($1, $2, $3, 'pending')`,
                    [sessionId, newScore, riskLevel]
                );
            }
        }

        if (newScore < TERMINATION_THRESHOLD || hasCriticalEvent) {
            await this.terminateSession(sessionId, "Auto-terminated due to critical integrity violation.");
        }

        return newScore;
    },

    /**
     * Terminate session immediately due to violations
     */
    async terminateSession(sessionId: string, reason: string) {
        await query(
            `UPDATE drive_students
             SET status = 'terminated', completed_at = NOW()
             WHERE id = $1`,
            [sessionId]
        );

        await query(
            `INSERT INTO proctoring_events (session_id, event_type, metadata)
             VALUES ($1, 'AUTO_TERMINATED', $2)`,
            [sessionId, JSON.stringify({ reason })]
        );
    },

    /**
     * Get live sessions for the monitoring dashboard
     */
    async getLiveMonitoring(driveId?: string) {
        const statuses = ["in_progress", "terminated"];
        const params: any[] = [statuses];
        let driveFilter = "";
        if (driveId) {
            params.push(driveId);
            driveFilter = `AND ds.drive_id = $${params.length}`;
        }

        const sessions = await query(
            `SELECT ds.id, ds.student_id, ds.status, ds.integrity_score,
                    ds.violations, ds.started_at, ds.time_remaining_seconds,
                    ad.name AS drive_name
             FROM drive_students ds
             LEFT JOIN assessment_drives ad ON ad.id = ds.drive_id
             WHERE ds.status = ANY($1::text[])
             ${driveFilter}
             ORDER BY ds.started_at DESC`,
            params
        );

        return sessions.map((s: any) => ({
            id: s.id,
            studentId: s.student_id,
            driveName: s.drive_name || "Unknown",
            status: s.status,
            integrityScore: s.integrity_score ?? 100,
            violations: s.violations ?? 0,
            startedAt: s.started_at,
            timeRemaining: s.time_remaining_seconds
        }));
    },

    /**
     * Get chronological event timeline for a specific session
     */
    async getSessionTimeline(sessionId: string) {
        const events = await query(
            `SELECT * FROM proctoring_events WHERE session_id = $1 ORDER BY timestamp DESC`,
            [sessionId]
        );

        const incident = await queryOne(
            `SELECT * FROM proctoring_incidents WHERE session_id = $1 LIMIT 1`,
            [sessionId]
        );

        const session = await queryOne(
            `SELECT integrity_score, violations, status FROM drive_students WHERE id = $1`,
            [sessionId]
        );

        return {
            events,
            incident,
            summary: session
        };
    },

    /**
     * Admin action to manually clear an incident
     */
    async clearIncident(sessionId: string, notes: string) {
        const incident = await queryOne<{ id: string }>(
            `SELECT id FROM proctoring_incidents WHERE session_id = $1 LIMIT 1`,
            [sessionId]
        );

        if (incident) {
            await query(
                `UPDATE proctoring_incidents
                 SET status = 'false_positive', notes = $1, updated_at = NOW()
                 WHERE id = $2`,
                [notes, incident.id]
            );
        }

        return { success: true };
    }
};

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
const TERMINATION_THRESHOLD = 50; // If integrity score drops below this, terminate
const CRITICAL_EVENTS = ["FACE_MISMATCH", "TIME_TAMPER_ATTEMPT", "mobile_detected"]; // Events that cause immediate termination

export const proctoringService = {
    /**
     * Log a proctoring event async (does not block standard exam flow)
     */
    async logEvent(sessionId: string, eventType: string, metadata?: any) {
        // 1. Insert into event stream
        await prisma.exam_events.create({
            data: {
                session_id: sessionId,
                event_type: eventType,
                metadata: metadata || {}
            }
        });

        // 2. Trigger async scoring evaluation (don't await to keep endpoint fast)
        this.evaluateIntegrity(sessionId).catch(err => {
            console.error(`Scoring error for session ${sessionId}:`, err);
        });

        // Broadcast to live monitoring sockets if needed (future scaling)
        return { success: true };
    },

    /**
     * Calculates session integrity score based on all logged events
     */
    async evaluateIntegrity(sessionId: string) {
        // Fetch all events for this session
        const events = await prisma.exam_events.findMany({
            where: { session_id: sessionId },
            select: { event_type: true }
        });

        let totalPenalty = 0;
        let hasCriticalEvent = false;

        // Calculate penalty sum
        for (const event of events) {
            const weight = EVENT_WEIGHTS[event.event_type] || 0;
            totalPenalty += weight;

            if (CRITICAL_EVENTS.includes(event.event_type)) {
                hasCriticalEvent = true;
            }
        }

        // Integrity is 100 minus total penalties (min 0)
        let newScore = Math.max(0, 100 - totalPenalty);

        // Determine risk level
        let riskLevel = "low";
        if (newScore < 50 || hasCriticalEvent) riskLevel = "high";
        else if (newScore < 80) riskLevel = "medium";

        // Update the session's integrity score and violation count
        await prisma.drive_students.update({
            where: { id: sessionId },
            data: {
                integrity_score: newScore,
                violations: events.length
            }
        });

        // Manage incident record
        if (riskLevel === "high" || riskLevel === "medium") {
            const existingIncident = await prisma.exam_incidents.findFirst({
                where: { session_id: sessionId }
            });

            if (existingIncident) {
                await prisma.exam_incidents.update({
                    where: { id: existingIncident.id },
                    data: {
                        score: newScore,
                        risk_level: riskLevel,
                        updated_at: new Date()
                    }
                });
            } else {
                await prisma.exam_incidents.create({
                    data: {
                        session_id: sessionId,
                        score: newScore,
                        risk_level: riskLevel,
                        status: "pending"
                    }
                });
            }
        }

        // Auto-terminate check
        if (newScore < TERMINATION_THRESHOLD || hasCriticalEvent) {
            await this.terminateSession(sessionId, "Auto-terminated due to critical integrity violation.");
        }

        return newScore;
    },

    /**
     * Terminate session immediately due to violations
     */
    async terminateSession(sessionId: string, reason: string) {
        await prisma.drive_students.update({
            where: { id: sessionId },
            data: {
                status: "terminated",
                completed_at: new Date()
            }
        });

        await prisma.exam_events.create({
            data: {
                session_id: sessionId,
                event_type: "AUTO_TERMINATED",
                metadata: { reason }
            }
        });
    },

    /**
     * Get live sessions for the monitoring dashboard
     */
    async getLiveMonitoring(driveId?: string) {
        // Find assigned, in_progress, or terminated sessions
        const query: any = {
            status: { in: ["in_progress", "terminated"] }
        };

        if (driveId) {
            query.drive_id = driveId;
        }

        const sessions = await prisma.drive_students.findMany({
            where: query,
            include: {
                drive: { select: { name: true } }
            },
            orderBy: { started_at: "desc" }
        });

        // Map to monitoring grid format
        // In a real app we'd join with the core user table to get names 
        // For MVP, returning the IDs and scores is enough to prove the engine works.
        return sessions.map((s: any) => ({
            id: s.id,
            studentId: s.student_id,
            driveName: s.drive?.name || "Unknown",
            status: s.status,
            integrityScore: s.integrity_score || 100,
            violations: s.violations || 0,
            startedAt: s.started_at,
            timeRemaining: s.time_remaining_seconds
        }));
    },

    /**
     * Get chronological event timeline for a specific session
     */
    async getSessionTimeline(sessionId: string) {
        const events = await prisma.exam_events.findMany({
            where: { session_id: sessionId },
            orderBy: { timestamp: "desc" }
        });

        const incident = await prisma.exam_incidents.findFirst({
            where: { session_id: sessionId }
        });

        const session = await prisma.drive_students.findUnique({
            where: { id: sessionId },
            select: { integrity_score: true, violations: true, status: true }
        });

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
        const incident = await prisma.exam_incidents.findFirst({
            where: { session_id: sessionId }
        });

        if (incident) {
            await prisma.exam_incidents.update({
                where: { id: incident.id },
                data: {
                    status: "false_positive",
                    notes,
                    updated_at: new Date()
                }
            });
        }

        return { success: true };
    }
};

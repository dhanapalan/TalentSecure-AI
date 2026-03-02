import { logger } from "../config/logger.js";
import { transitionDrivesToLive, transitionDrivesToCompleted } from "../services/drive.service.js";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

let timer: ReturnType<typeof setInterval> | null = null;

async function tick() {
    try {
        await transitionDrivesToLive();
        await transitionDrivesToCompleted();
    } catch (err) {
        logger.error("Drive scheduler tick failed", { error: (err as Error).message });
    }
}

export function startDriveScheduler() {
    if (timer) return;
    // Run immediately on startup, then every POLL_INTERVAL_MS
    tick();
    timer = setInterval(tick, POLL_INTERVAL_MS);
    logger.info(`✓ Drive scheduler started (polling every ${POLL_INTERVAL_MS / 1000}s)`);
}

export function stopDriveScheduler() {
    if (timer) {
        clearInterval(timer);
        timer = null;
        logger.info("Drive scheduler stopped");
    }
}

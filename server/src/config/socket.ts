import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { allowedCorsOrigins, isAllowedCorsOrigin } from "./corsOrigins.js";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { AuthPayload } from "../types/index.js";

let io: Server;

/** Best-effort userId extraction from the socket handshake auth token. */
function userIdFromHandshake(socket: Socket): string | null {
  const token =
    (socket.handshake.auth?.token as string | undefined) ||
    (typeof socket.handshake.headers.authorization === "string"
      ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
      : undefined);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload & { purpose?: string };
    if (payload.purpose) return null; // not an access token
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

export const initSocketIO = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: allowedCorsOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      callback(null, isAllowedCorsOrigin(typeof origin === "string" ? origin : undefined));
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // ── Root namespace: notifications / general per-user channels ───────────────
  // notification.service.ts emits to io.to(`user:${userId}`), so clients must be
  // joined to that room. Auto-join from the authenticated token and also honour
  // the client's explicit "join-user" event (validated against the token).
  io.on("connection", (socket: Socket) => {
    const authedUserId = userIdFromHandshake(socket);
    if (authedUserId) {
      socket.join(`user:${authedUserId}`);
      logger.debug(`Socket ${socket.id} joined user:${authedUserId}`);
    }

    socket.on("join-user", (userId: string) => {
      // Only allow joining your own channel when the token identifies you;
      // fall back to the requested id when no token was provided (dev/testing).
      const target = authedUserId || (typeof userId === "string" ? userId : null);
      if (target) socket.join(`user:${target}`);
    });

    socket.on("disconnect", () => {
      // rooms are cleaned up automatically by socket.io on disconnect
    });
  });

  // Proctoring namespace
  const proctoringNs = io.of("/proctoring");

  proctoringNs.on("connection", (socket: Socket) => {
    logger.debug(`Proctoring client connected: ${socket.id}`);

    socket.on("join-session", (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      logger.debug(`Socket ${socket.id} joined session:${sessionId}`);
    });

    // Receive face verification snapshots from client
    socket.on("face-snapshot", (data: { sessionId: string; image: string; timestamp: number }) => {
      // Forward to AI engine for face match verification
      proctoringNs.to(`session:${data.sessionId}`).emit("face-snapshot-ack", {
        timestamp: data.timestamp,
        status: "received",
      });
    });

    // Browser focus events
    socket.on("browser-event", (data: { sessionId: string; event: string; timestamp: number }) => {
      logger.warn(`Browser event [${data.event}] in session ${data.sessionId}`);
      proctoringNs.to(`session:${data.sessionId}`).emit("violation-alert", {
        type: data.event,
        timestamp: data.timestamp,
      });
    });

    socket.on("disconnect", (reason) => {
      logger.debug(`Proctoring client disconnected: ${socket.id} — ${reason}`);
    });
  });

  logger.info("✓ Socket.IO initialized (notifications + proctoring namespaces)");
  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};

import { io, Socket } from "socket.io-client";

let proctoringSocket: Socket | null = null;

export function connectProctoringSocket(): Socket {
  if (proctoringSocket?.connected) return proctoringSocket;

  proctoringSocket = io("/proctoring", {
    transports: ["websocket"],
    auth: {
      token: localStorage.getItem("accessToken"),
    },
  });

  return proctoringSocket;
}

export function disconnectProctoringSocket(): void {
  proctoringSocket?.disconnect();
  proctoringSocket = null;
}

export function getProctoringSocket(): Socket | null {
  return proctoringSocket;
}

// ── General / Notifications Namespace ────────────────────────────────────────

let generalSocket: Socket | null = null;

export function connectGeneralSocket(): Socket {
  if (generalSocket?.connected) return generalSocket;

  generalSocket = io("/", {
    transports: ["websocket"],
    auth: {
      token: localStorage.getItem("accessToken"),
    },
  });

  return generalSocket;
}

export function disconnectGeneralSocket(): void {
  generalSocket?.disconnect();
  generalSocket = null;
}

export function getGeneralSocket(): Socket | null {
  return generalSocket;
}

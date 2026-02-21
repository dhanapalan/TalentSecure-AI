// =============================================================================
// TalentSecure AI — Auth Store (React 18 useSyncExternalStore)
// =============================================================================

import { useSyncExternalStore } from "react";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
  college_id?: string | null;
  department?: string | null;
  phone_number?: string | null;
  dob?: string | null;
  is_profile_complete?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
}

// ── Internal state ───────────────────────────────────────────────────────────

let state: AuthState = {
  isAuthenticated: !!localStorage.getItem("accessToken"),
  user: (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem("accessToken"),
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AuthState {
  return state;
}

// ── React hook ───────────────────────────────────────────────────────────────

export function useAuthStore<T>(selector: (s: AuthState) => T): T {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector(snap);
}

// ── Actions ──────────────────────────────────────────────────────────────────

export const authActions = {
  login(accessToken: string, user: AuthUser) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(user));
    state = { isAuthenticated: true, user, token: accessToken };
    emitChange();
  },

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    state = { isAuthenticated: false, user: null, token: null };
    emitChange();
  },

  setUser(user: AuthUser) {
    localStorage.setItem("user", JSON.stringify(user));
    state = { ...state, user };
    emitChange();
  },

  getState(): AuthState {
    return state;
  },
};

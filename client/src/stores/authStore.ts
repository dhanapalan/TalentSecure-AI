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
  college_name?: string | null;
  department?: string | null;
  phone_number?: string | null;
  dob?: string | null;
  is_profile_complete?: boolean;
  must_change_password?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
}

// ── Internal state ───────────────────────────────────────────────────────────

// Tokens are stored in sessionStorage (cleared on tab close) rather than
// localStorage to reduce XSS token-theft exposure window.
// The ideal fix is httpOnly cookies — migrate when backend cookie auth is added.
let state: AuthState = {
  isAuthenticated: !!sessionStorage.getItem("accessToken"),
  user: (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })(),
  token: sessionStorage.getItem("accessToken"),
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
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("user", JSON.stringify(user));
    state = { isAuthenticated: true, user, token: accessToken };
    emitChange();
  },

  logout() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    state = { isAuthenticated: false, user: null, token: null };
    emitChange();
  },

  setUser(user: AuthUser) {
    sessionStorage.setItem("user", JSON.stringify(user));
    state = { ...state, user };
    emitChange();
  },

  getState(): AuthState {
    return state;
  },
};

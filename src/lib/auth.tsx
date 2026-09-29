'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react';
import { authStorage } from './authStorage';
import { api } from './api';
import type { User } from './types';

const listeners = new Set<() => void>();
let currentUser: User | null = null;
let loaded = false;

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (!loaded) {
    currentUser = authStorage.getUser();
    loaded = true;
  }
  return currentUser;
}

function getServerSnapshot() {
  return null;
}

const noopSubscribe = () => () => {};

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  setSession: (token: string, user: User) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<{
  setSession: AuthContextValue['setSession'];
  updateUser: AuthContextValue['updateUser'];
  logout: AuthContextValue['logout'];
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useCallback((token: string, nextUser: User) => {
    authStorage.setSession(token, nextUser);
    currentUser = nextUser;
    loaded = true;
    notify();
  }, []);

  // Merges a partial update (e.g. a freshly-saved avatar) into the signed-in
  // user without touching the token — used after a PATCH succeeds so the UI
  // reflects it immediately without a full re-login.
  const updateUser = useCallback((patch: Partial<User>) => {
    const token = authStorage.getToken();
    if (!token || !currentUser) return;
    const nextUser = { ...currentUser, ...patch };
    authStorage.setSession(token, nextUser);
    currentUser = nextUser;
    loaded = true;
    notify();
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    currentUser = null;
    loaded = true;
    notify();
  }, []);

  // The cached copy in localStorage was only ever set at login time — it
  // goes stale as soon as the account changes on another device (e.g. an
  // avatar customized elsewhere). Re-sync from the server on every app load
  // so a fresh sign-in anywhere picks up the latest server state.
  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) return;
    api.me().then(
      (fresh) => setSession(token, fresh),
      () => logout(),
    );
  }, [setSession, logout]);

  return (
    <AuthContext.Provider value={{ setSession, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return {
    user,
    ready,
    setSession: ctx.setSession,
    updateUser: ctx.updateUser,
    logout: ctx.logout,
  };
}

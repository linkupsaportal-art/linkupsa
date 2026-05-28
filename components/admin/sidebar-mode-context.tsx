"use client";

import * as React from "react";

/**
 * Sidebar mode — three states:
 *   - "expanded"  — full width with labels (260px)
 *   - "collapsed" — icon rail only (72px)
 *   - "hover"     — icon rail that expands when hovered
 *
 * Mode is persisted to localStorage so the user's choice survives reloads.
 */
export type SidebarMode = "expanded" | "collapsed" | "hover";

const STORAGE_KEY = "admin.sidebar.mode";
const DEFAULT_MODE: SidebarMode = "expanded";

type Ctx = {
  mode: SidebarMode;
  setMode: (next: SidebarMode) => void;
  /** Cycles expanded → collapsed → hover → expanded */
  cycleMode: () => void;
};

const SidebarModeCtx = React.createContext<Ctx | null>(null);

export function SidebarModeProvider({ children }: { children: React.ReactNode }) {
  // Default for SSR; we hydrate from localStorage on mount.
  const [mode, setModeState] = React.useState<SidebarMode>(DEFAULT_MODE);

  // Hydrate once on the client.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as SidebarMode | null;
      if (stored === "expanded" || stored === "collapsed" || stored === "hover") {
        setModeState(stored);
      }
    } catch {
      // ignore — sandboxed envs / SSR safe
    }
  }, []);

  const setMode = React.useCallback((next: SidebarMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const cycleMode = React.useCallback(() => {
    setModeState((prev) => {
      const next: SidebarMode =
        prev === "expanded" ? "collapsed" : prev === "collapsed" ? "hover" : "expanded";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ mode, setMode, cycleMode }),
    [mode, setMode, cycleMode],
  );

  return <SidebarModeCtx.Provider value={value}>{children}</SidebarModeCtx.Provider>;
}

export function useSidebarMode(): Ctx {
  const ctx = React.useContext(SidebarModeCtx);
  if (!ctx) {
    throw new Error("useSidebarMode must be used inside <SidebarModeProvider>");
  }
  return ctx;
}

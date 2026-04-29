"use client";

import { useEffect } from "react";

type SimulationHeartbeatProps = {
  intervalMs?: number;
  initialDelayMs?: number;
};

export function SimulationHeartbeat({
  intervalMs = 70000,
  initialDelayMs = 12000,
}: SimulationHeartbeatProps) {
  useEffect(() => {
    let active = true;
    let timeout: number | undefined;
    const cooldownKey = "tradex:last-simulation-heartbeat";

    const getNextDelayMs = () => {
      const marketPulse = Math.floor(Math.random() * intervalMs);
      const baseDelay = Math.floor(intervalMs * 0.45);
      return baseDelay + marketPulse;
    };

    const tick = async () => {
      if (!active) return;
      if (document.visibilityState !== "visible" || (typeof navigator !== "undefined" && !navigator.onLine)) {
        timeout = window.setTimeout(() => {
          void tick();
        }, getNextDelayMs());
        return;
      }

      const now = Date.now();
      const lastRun = Number(window.localStorage.getItem(cooldownKey) ?? "0");

      if (now - lastRun >= Math.floor(intervalMs * 0.35)) {
        try {
          await fetch("/api/simulation", {
            method: "POST",
            cache: "no-store",
          });
          window.localStorage.setItem(cooldownKey, String(now));
        } catch {
          // Ignore transient dev-server failures.
        }
      }

      timeout = window.setTimeout(() => {
        void tick();
      }, getNextDelayMs());
    };

    timeout = window.setTimeout(() => {
      void tick();
    }, initialDelayMs + Math.floor(Math.random() * 6000));

    return () => {
      active = false;
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [initialDelayMs, intervalMs]);

  return null;
}

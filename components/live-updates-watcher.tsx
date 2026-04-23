"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useRef } from "react";

type LiveUpdatesWatcherProps = {
  initialVersion: string;
  intervalMs?: number;
};

const DEFAULT_INTERVAL_MS = 5000;

export function LiveUpdatesWatcher({
  initialVersion,
  intervalMs = DEFAULT_INTERVAL_MS,
}: LiveUpdatesWatcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const versionRef = useRef(initialVersion);
  const refreshingRef = useRef(false);

  useEffect(() => {
    versionRef.current = initialVersion;
  }, [initialVersion]);

  useEffect(() => {
    let cancelled = false;

    async function checkForUpdates() {
      if (refreshingRef.current) {
        return;
      }

      try {
        const response = await fetch("/api/live-state", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { version?: string };
        const nextVersion = payload.version;

        if (!nextVersion || cancelled) {
          return;
        }

        if (nextVersion !== versionRef.current) {
          versionRef.current = nextVersion;
          refreshingRef.current = true;

          startTransition(() => {
            router.refresh();
          });

          window.setTimeout(() => {
            refreshingRef.current = false;
          }, 1200);
        }
      } catch {
        // Ignore transient polling errors and try again on the next cycle.
      }
    }

    const intervalId = window.setInterval(checkForUpdates, intervalMs);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkForUpdates();
      }
    }

    function handleFocus() {
      void checkForUpdates();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    void checkForUpdates();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [intervalMs, pathname, router]);

  return null;
}

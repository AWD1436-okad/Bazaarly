"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ChallengeCountdownProps = {
  cycleEndsAt: string;
  initialSeconds: number;
};

function formatRemaining(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}m`
    : `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function ChallengeCountdown({ cycleEndsAt, initialSeconds }: ChallengeCountdownProps) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(() => Math.max(0, initialSeconds));
  const label = useMemo(() => formatRemaining(seconds), [seconds]);

  useEffect(() => {
    if (seconds <= 0) {
      router.refresh();
      return;
    }

    const timeout = window.setTimeout(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [router, seconds]);

  return <span className="challenge-countdown">New challenges in {label}</span>;
}

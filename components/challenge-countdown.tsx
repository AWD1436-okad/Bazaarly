"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ChallengeCountdownProps = {
  cycleEndsAt: string;
};

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function ChallengeCountdown({ cycleEndsAt }: ChallengeCountdownProps) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const seconds = useMemo(() => {
    const endsAt = new Date(cycleEndsAt).getTime();
    return Math.max(0, Math.ceil((endsAt - now) / 1000));
  }, [cycleEndsAt, now]);
  const label = useMemo(() => formatRemaining(seconds), [seconds]);

  useEffect(() => {
    if (seconds <= 0) {
      router.refresh();
      return;
    }

    const timeout = window.setTimeout(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [router, seconds]);

  return <span className="challenge-countdown">New challenges in {label}</span>;
}

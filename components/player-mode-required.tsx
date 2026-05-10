"use client";

import { useState } from "react";

import type { PlayerMode, PlayerModeConfig } from "@/lib/player-mode";

type PlayerModeRequiredProps = {
  currentPlayerMode: PlayerMode;
  playerModeOptions: ReadonlyArray<PlayerModeConfig>;
};

function getModeNumber(mode: PlayerMode) {
  if (mode === "LITTLE") return "1";
  if (mode === "JUNIOR") return "2";
  if (mode === "YOUNG") return "3";
  return "4";
}

export function PlayerModeRequired({
  currentPlayerMode,
  playerModeOptions,
}: PlayerModeRequiredProps) {
  const [playerMode, setPlayerMode] = useState<PlayerMode>(currentPlayerMode);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveMode() {
    setSaving(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.set("playerMode", playerMode);

      const response = await fetch("/settings/player-mode", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Could not save player mode");
      }

      window.location.assign("/dashboard");
    } catch {
      setStatus("Could not save your mode. Try again.");
      setSaving(false);
    }
  }

  return (
    <main className="auth-layout player-mode-required-page">
      <section className="auth-card auth-card--single">
        <div className="stack">
          <div>
            <span className="tag">Profit Planet</span>
            <h1>Choose your player mode</h1>
            <p className="muted">
              Pick the version that feels easiest for you. You can change it later in Settings.
            </p>
          </div>

          <div className="player-mode-picker">
            <div className="player-mode-picker__grid">
              {playerModeOptions.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={
                    mode.value === playerMode
                      ? "player-mode-card player-mode-card--selected"
                      : "player-mode-card"
                  }
                  onClick={() => setPlayerMode(mode.value)}
                  disabled={saving}
                >
                  <span className="player-mode-card__topline">
                    <span className="player-mode-option__icon" aria-hidden="true">
                      {getModeNumber(mode.value)}
                    </span>
                    <span>
                      <strong>{mode.label}</strong>
                      <small>{mode.ageLabel}</small>
                    </span>
                  </span>
                  <span>{mode.signupDescription}</span>
                </button>
              ))}
            </div>
          </div>

          {status ? <p className="form-status form-status--error">{status}</p> : null}

          <button type="button" onClick={() => void saveMode()} disabled={saving}>
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </section>
    </main>
  );
}

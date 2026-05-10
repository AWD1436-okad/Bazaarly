"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallAppCardProps = {
  compact?: boolean;
};

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes standalone through navigator.
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function InstallAppCard({ compact = false }: InstallAppCardProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canShowFallback] = useState(true);
  const [isInstalled, setIsInstalled] = useState(() => (
    typeof window === "undefined" ? false : isStandaloneDisplay()
  ));
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const dismissedUntil = Number(window.localStorage.getItem("profitPlanetInstallDismissedUntil") ?? "0");
    return dismissedUntil > Date.now();
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
    };
    const handleInstalled = () => setIsInstalled(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled || dismissed || (compact && !installPrompt)) {
    return null;
  }

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "dismissed") {
      handleDismiss();
    }
  }

  function handleDismiss() {
    const dismissedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem("profitPlanetInstallDismissedUntil", String(dismissedUntil));
    setDismissed(true);
  }

  return (
    <section className={compact ? "install-card install-card--compact" : "install-card"}>
      <div>
        <span className="tag">App mode</span>
        <h2>Install Profit Planet</h2>
        <p>
          Add Profit Planet to your home screen so it opens like a game app.
        </p>
        {!installPrompt && canShowFallback ? (
          <p className="muted">
            iPhone/iPad: tap Share, then Add to Home Screen. Android/Chrome: open the
            browser menu, then tap Install app or Add to Home screen.
          </p>
        ) : null}
      </div>
      <div className="install-card__actions">
        {installPrompt ? (
          <button type="button" onClick={() => void handleInstall()}>
            Install app
          </button>
        ) : null}
        <button type="button" className="ghost-button" onClick={handleDismiss}>
          Not now
        </button>
      </div>
    </section>
  );
}

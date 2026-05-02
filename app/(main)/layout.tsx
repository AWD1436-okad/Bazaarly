import { LiveUpdatesWatcher } from "@/components/live-updates-watcher";
import { Navigation } from "@/components/navigation";
import { AutoRestockApprovalGate } from "@/components/auto-restock-approval-gate";
import { SecuritySetupLock } from "@/components/security-setup-lock";
import { hasCompletedSecuritySetup, requireUser } from "@/lib/auth";
import { getLiveStateVersion } from "@/lib/live-state";
import { getUnreadNotificationBadge } from "@/lib/notifications";
import { getActiveCurrencyCode } from "@/lib/price-profiles";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default async function MainLayout({ children }: MainLayoutProps) {
  const user = await requireUser({ allowIncompleteSecurity: true });

  if (!hasCompletedSecuritySetup(user)) {
    return (
      <main className="auth-layout">
        <SecuritySetupLock />
      </main>
    );
  }

  const [unreadNotifications, liveStateVersion, currencyCode] = await Promise.all([
    getUnreadNotificationBadge(user.id),
    getLiveStateVersion(user.id),
    getActiveCurrencyCode(user.id),
  ]);

  return (
    <main className="app-shell">
      <LiveUpdatesWatcher initialVersion={liveStateVersion} />
      <AutoRestockApprovalGate />
      <Navigation
        balance={user.balance}
        currencyCode={currencyCode}
        unreadNotifications={unreadNotifications.unreadCount}
        unreadNotificationLabel={unreadNotifications.label}
      />
      {children}
    </main>
  );
}

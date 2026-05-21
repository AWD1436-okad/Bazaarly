import { LiveUpdatesWatcher } from "@/components/live-updates-watcher";
import { Navigation } from "@/components/navigation";
import { AutoRestockApprovalGate } from "@/components/auto-restock-approval-gate";
import { PlayerModeRequired } from "@/components/player-mode-required";
import { SecuritySetupLock } from "@/components/security-setup-lock";
import { normalizeAppearancePreset } from "@/lib/appearance";
import { hasCompletedSecuritySetup, requireUser } from "@/lib/auth";
import { getLiveStateVersion } from "@/lib/live-state";
import { getUnreadNotificationBadge } from "@/lib/notifications";
import { getPlayerModeConfig, PLAYER_MODE_OPTIONS } from "@/lib/player-mode";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";

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

  const [unreadNotifications, liveStateVersion, currencyCode, activeCart, recentNotifications] = await Promise.all([
    getUnreadNotificationBadge(user.id),
    getLiveStateVersion(user.id),
    getActiveCurrencyCode(user.id),
    prisma.cart.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      select: {
        items: {
          select: { quantity: true },
        },
      },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        type: true,
        message: true,
        read: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);
  const playerModeConfig = getPlayerModeConfig((user as { playerMode?: unknown }).playerMode);
  const playerModeConfirmed = Boolean((user as { playerModeConfirmed?: boolean | null }).playerModeConfirmed);

  if (!playerModeConfirmed) {
    return (
      <PlayerModeRequired
        currentPlayerMode={playerModeConfig.value}
        playerModeOptions={PLAYER_MODE_OPTIONS}
      />
    );
  }

  return (
    <main
      className="app-shell"
      data-theme={normalizeAppearancePreset(user.appearancePreset)}
      data-player-mode={playerModeConfig.value.toLowerCase()}
    >
      <LiveUpdatesWatcher initialVersion={liveStateVersion} />
      <AutoRestockApprovalGate />
      <Navigation
        balance={user.balance}
        currencyCode={currencyCode}
        unreadNotifications={unreadNotifications.unreadCount}
        unreadNotificationLabel={unreadNotifications.label}
        recentNotifications={recentNotifications.map((notification) => ({
          ...notification,
          createdAtLabel: notification.createdAt.toLocaleString(),
        }))}
        cartItemCount={activeCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0}
        playerMode={playerModeConfig.value}
      />
      {children}
    </main>
  );
}

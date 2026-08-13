import { LiveUpdatesWatcher } from "@/components/live-updates-watcher";
import { Navigation } from "@/components/navigation";
import { SecuritySetupLock } from "@/components/security-setup-lock";
import { normalizeAppearancePreset } from "@/lib/appearance";
import { hasCompletedSecuritySetup, requireUser } from "@/lib/auth";
import { getLiveStateVersion } from "@/lib/live-state";
import { getUnreadNotificationBadge } from "@/lib/notifications";
import { formatCurrency } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

type MainLayoutProps = {
  children: React.ReactNode;
};

function formatNotificationTime(createdAt: Date) {
  const elapsedMs = Math.max(0, Date.now() - createdAt.getTime());
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";

  return createdAt.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

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
        autoRestockPlan: true,
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
      take: 20,
    }),
  ]);
  return (
    <main
      className="app-shell"
      data-theme={normalizeAppearancePreset(user.appearancePreset)}
      data-player-mode="advanced"
    >
      <LiveUpdatesWatcher initialVersion={liveStateVersion} />
      <Navigation
        currencyCode={currencyCode}
        balanceLabel={formatCurrency(user.balance, currencyCode)}
        unreadNotifications={unreadNotifications.unreadCount}
        unreadNotificationLabel={unreadNotifications.label}
        recentNotifications={recentNotifications.map((notification) => ({
          ...notification,
          createdAtLabel: formatNotificationTime(notification.createdAt),
        }))}
        cartItemCount={(activeCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0) + (activeCart?.autoRestockPlan ? 1 : 0)}
        playerMode="ADVANCED"
      />
      {children}
    </main>
  );
}

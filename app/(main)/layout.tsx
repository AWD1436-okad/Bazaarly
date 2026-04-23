import { LiveUpdatesWatcher } from "@/components/live-updates-watcher";
import { Navigation } from "@/components/navigation";
import { requireUser } from "@/lib/auth";
import { getLiveStateVersion } from "@/lib/live-state";
import { getUnreadNotificationBadge } from "@/lib/notifications";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default async function MainLayout({ children }: MainLayoutProps) {
  const user = await requireUser();
  const [unreadNotifications, liveStateVersion] = await Promise.all([
    getUnreadNotificationBadge(user.id),
    getLiveStateVersion(user.id),
  ]);

  return (
    <main className="app-shell">
      <LiveUpdatesWatcher initialVersion={liveStateVersion} />
      <Navigation
        balance={user.balance}
        unreadNotifications={unreadNotifications.unreadCount}
        unreadNotificationLabel={unreadNotifications.label}
      />
      {children}
    </main>
  );
}

import { Navigation } from "@/components/navigation";
import { requireUser } from "@/lib/auth";
import { getUnreadNotificationBadge } from "@/lib/notifications";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default async function MainLayout({ children }: MainLayoutProps) {
  const user = await requireUser();
  const unreadNotifications = await getUnreadNotificationBadge(user.id);

  return (
    <main className="app-shell">
      <Navigation
        balance={user.balance}
        unreadNotifications={unreadNotifications.unreadCount}
        unreadNotificationLabel={unreadNotifications.label}
      />
      {children}
    </main>
  );
}

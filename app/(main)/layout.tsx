import { Navigation } from "@/components/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default async function MainLayout({ children }: MainLayoutProps) {
  const user = await requireUser();

  const unreadNotifications = await prisma.notification.count({
    where: {
      userId: user.id,
      read: false,
    },
  });

  return (
    <main className="app-shell">
      <Navigation balance={user.balance} unreadNotifications={unreadNotifications} />
      {children}
    </main>
  );
}

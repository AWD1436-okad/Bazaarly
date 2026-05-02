import type { Route } from "next";
import Link from "next/link";

import { APP_ICONS, AppIcon } from "@/components/app-icon";
import { BrandLogo } from "@/components/brand-logo";
import { formatCurrency } from "@/lib/money";

type NavigationProps = {
  balance: number;
  unreadNotifications: number;
  unreadNotificationLabel?: string | null;
  currentSearch?: string;
  currentSort?: string;
  currencyCode?: string;
};

export function Navigation({
  balance,
  unreadNotifications,
  unreadNotificationLabel,
  currentSearch,
  currentSort,
  currencyCode = "AUD",
}: NavigationProps) {
  return (
    <header className="topbar">
      <div className="brand-area">
        <Link href="/marketplace" className="brand-link">
          <BrandLogo />
          <span>
            <strong className="brand-wordmark">
              <span className="brand-wordmark__trade">trade</span>
              <span className="brand-wordmark__x">x</span>
            </strong>
            <small>Shared global marketplace</small>
          </span>
        </Link>
      </div>

      <form action="/marketplace" className="search-bar">
        <input
          type="search"
          name="q"
          placeholder="Search apples, cheap juice, fruit shop..."
          defaultValue={currentSearch}
        />
        <select name="sort" defaultValue={currentSort ?? "relevance"}>
          <option value="relevance">Relevance</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Rating</option>
          <option value="stock">Most Stock</option>
        </select>
        <button type="submit">Search</button>
      </form>

      <nav className="topbar-links">
        <span className="balance-pill">
          <AppIcon icon={APP_ICONS.wallet} tone="gradient" />
          {formatCurrency(balance, currencyCode)}
        </span>
        <Link href="/notifications" className="notification-pill">
          <AppIcon icon={APP_ICONS.bell} />
          Notifications
          {unreadNotifications > 0 ? (
            <strong>{unreadNotificationLabel ?? unreadNotifications}</strong>
          ) : null}
        </Link>
        <Link href="/dashboard" className="topbar-link">
          <AppIcon icon={APP_ICONS.dashboard} />
          Dashboard
        </Link>
        <Link href={"/challenges" as Route} className="topbar-link">
          <AppIcon icon={APP_ICONS.challenges} />
          Challenges
        </Link>
        <Link href="/dashboard/supplier" className="topbar-link">
          <AppIcon icon={APP_ICONS.supplier} />
          Supplier
        </Link>
        <Link href="/orders" className="topbar-link">
          <AppIcon icon={APP_ICONS.orders} />
          Orders
        </Link>
        <Link href="/cart" className="topbar-link">
          <AppIcon icon={APP_ICONS.cart} />
          Cart
        </Link>
        <Link href={"/settings" as Route} className="topbar-link">
          <AppIcon icon={APP_ICONS.settings} />
          Settings
        </Link>
      </nav>
    </header>
  );
}

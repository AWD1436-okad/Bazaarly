import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { formatCurrency } from "@/lib/money";

type NavigationProps = {
  balance: number;
  unreadNotifications: number;
  unreadNotificationLabel?: string | null;
  currentSearch?: string;
  currentSort?: string;
};

export function Navigation({
  balance,
  unreadNotifications,
  unreadNotificationLabel,
  currentSearch,
  currentSort,
}: NavigationProps) {
  return (
    <header className="topbar">
      <div className="brand-area">
        <Link href="/marketplace" className="brand-link">
          <BrandLogo />
          <span>
            <strong>Bazaarly</strong>
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
        <span className="balance-pill">{formatCurrency(balance)}</span>
        <Link href="/notifications" className="notification-pill">
          Notifications
          {unreadNotifications > 0 ? (
            <strong>{unreadNotificationLabel ?? unreadNotifications}</strong>
          ) : null}
        </Link>
        <Link href="/dashboard" className="topbar-link">
          Dashboard
        </Link>
        <Link href="/dashboard/supplier" className="topbar-link">
          Supplier
        </Link>
        <Link href="/orders" className="topbar-link">
          Orders
        </Link>
        <Link href="/cart" className="topbar-link">
          Cart
        </Link>
        <form action="/auth/logout" method="post">
          <button type="submit" className="ghost-button small">
            Logout
          </button>
        </form>
      </nav>
    </header>
  );
}

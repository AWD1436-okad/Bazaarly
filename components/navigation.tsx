import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { formatCurrency } from "@/lib/money";

type NavigationProps = {
  balance: number;
  unreadNotifications: number;
  currentSearch?: string;
  currentSort?: string;
};

export function Navigation({
  balance,
  unreadNotifications,
  currentSearch,
  currentSort,
}: NavigationProps) {
  return (
    <header className="topbar">
      <div className="brand-area">
        <Link href="/marketplace" className="brand-link">
          <span className="brand-mark">B</span>
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
          {unreadNotifications > 0 ? <strong>{unreadNotifications}</strong> : null}
        </Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/dashboard/supplier">Supplier</Link>
        <Link href="/orders">Orders</Link>
        <Link href="/cart">Cart</Link>
        <form action={logoutAction}>
          <button type="submit" className="ghost-button small">
            Logout
          </button>
        </form>
      </nav>
    </header>
  );
}

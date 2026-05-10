"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_ICONS, AppIcon } from "@/components/app-icon";
import { BrandLogo } from "@/components/brand-logo";
import { formatCurrency } from "@/lib/money";
import { getPlayerModeConfig, type PlayerMode } from "@/lib/player-mode";

type NavigationProps = {
  balance: number;
  unreadNotifications: number;
  unreadNotificationLabel?: string | null;
  currentSearch?: string;
  currentSort?: string;
  currencyCode?: string;
  playerMode?: PlayerMode;
};

export function Navigation({
  balance,
  unreadNotifications,
  unreadNotificationLabel,
  currentSearch,
  currentSort,
  currencyCode = "AUD",
  playerMode = "ADVANCED",
}: NavigationProps) {
  const pathname = usePathname();
  const showSearch = pathname === "/marketplace" || pathname?.startsWith("/shop/");
  const modeConfig = getPlayerModeConfig(playerMode);
  const navItems = [
    { href: "/dashboard", label: modeConfig.navLabels.dashboard, icon: APP_ICONS.dashboard },
    { href: "/marketplace", label: modeConfig.navLabels.marketplace, icon: APP_ICONS.store },
    { href: "/dashboard/supplier", label: modeConfig.navLabels.supplier, icon: APP_ICONS.supplier },
    { href: "/challenges", label: modeConfig.navLabels.challenges, icon: APP_ICONS.challenges },
    { href: "/orders", label: modeConfig.navLabels.orders, icon: APP_ICONS.orders },
    { href: "/cart", label: modeConfig.navLabels.cart, icon: APP_ICONS.cart },
    { href: "/settings", label: modeConfig.navLabels.settings, icon: APP_ICONS.settings },
  ] as const;

  return (
    <>
    <header className={showSearch ? "topbar" : "topbar topbar--no-search"}>
      <div className="brand-area">
        <Link href="/marketplace" className="brand-link">
          <BrandLogo />
          <span>
            <strong className="brand-wordmark">
              <span className="brand-wordmark__trade">Profit</span>
              <span className="brand-wordmark__x">Planet</span>
            </strong>
          <small>{modeConfig.shortLabel} mode</small>
          </span>
        </Link>
      </div>

      <div className="topbar-status">
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
      </div>

      {showSearch ? (
        <form action="/marketplace" className="search-bar">
          <input
            type="search"
            name="q"
            placeholder="Search apples, cheap juice, planet shops..."
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
      ) : null}

      <nav className="topbar-links">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href as Route}
            className={pathname === item.href ? "topbar-link topbar-link--active" : "topbar-link"}
          >
            <AppIcon icon={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
    <nav className="mobile-bottom-nav" aria-label="Main mobile navigation">
      {navItems.slice(0, 5).map((item) => (
        <Link
          key={item.href}
          href={item.href as Route}
          className={pathname === item.href ? "mobile-bottom-nav__link mobile-bottom-nav__link--active" : "mobile-bottom-nav__link"}
        >
          <AppIcon icon={item.icon} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
    </>
  );
}

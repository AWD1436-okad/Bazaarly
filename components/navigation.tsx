"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { APP_ICONS, AppIcon } from "@/components/app-icon";
import { CartDrawer } from "@/components/cart-drawer";
import { getPlayerModeConfig, type PlayerMode } from "@/lib/player-mode";

type NavigationProps = {
  unreadNotifications: number;
  unreadNotificationLabel?: string | null;
  recentNotifications?: Array<{
    id: string;
    type: string;
    message: string;
    read: boolean;
    createdAtLabel: string;
  }>;
  cartItemCount?: number;
  currentSearch?: string;
  currentSort?: string;
  currencyCode?: string;
  playerMode?: PlayerMode;
};

export function Navigation({
  unreadNotifications,
  unreadNotificationLabel,
  recentNotifications = [],
  cartItemCount = 0,
  currentSearch,
  currentSort,
  currencyCode = "AUD",
  playerMode: _playerMode = "ADVANCED",
}: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const showSearch = pathname?.startsWith("/shop/");
  const modeConfig = getPlayerModeConfig("ADVANCED");
  const navItems = [
    { href: "/dashboard", label: modeConfig.navLabels.dashboard, icon: APP_ICONS.dashboard },
    { href: "/marketplace", label: modeConfig.navLabels.marketplace, icon: APP_ICONS.store },
    { href: "/dashboard/supplier", label: modeConfig.navLabels.supplier, icon: APP_ICONS.supplier },
    { href: "/challenges", label: modeConfig.navLabels.challenges, icon: APP_ICONS.challenges },
    { href: "/cart", label: modeConfig.navLabels.cart, icon: APP_ICONS.cart, badge: cartItemCount },
    { href: "/settings", label: modeConfig.navLabels.settings, icon: APP_ICONS.settings },
  ];

  useEffect(() => {
    function closeNotificationMenu(event: MouseEvent) {
      if (!notificationMenuRef.current?.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeNotificationMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeNotificationMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function openNotificationMenu() {
    const shouldOpen = !notificationMenuOpen;
    setNotificationMenuOpen(shouldOpen);

    // Opening the panel is the acknowledgement action, so the badge does not get stuck.
    if (!shouldOpen || unreadNotifications === 0) return;

    const response = await fetch("/notifications/read-all", { method: "POST" });
    if (response.ok || response.redirected) {
      router.refresh();
    }
  }

  return (
    <>
    <header className={showSearch ? "topbar" : "topbar topbar--no-search"}>
      <div className="brand-area">
        <Link href="/marketplace" className="brand-link">
          <span>
            <strong className="brand-wordmark">
              <span className="brand-wordmark__trade">Profit</span>
              <span className="brand-wordmark__x">Planet</span>
            </strong>
          <small>Business trading game</small>
          </span>
        </Link>
      </div>

      <div className="topbar-status">
        <Link href="/orders" className="balance-pill" aria-label="Open buyer and seller history">
          <AppIcon icon={APP_ICONS.orders} tone="gradient" />
          Orders
        </Link>
        <div className="notification-menu" ref={notificationMenuRef}>
          <button
            type="button"
            className="notification-pill"
            aria-expanded={notificationMenuOpen}
            aria-controls="notification-panel"
            onClick={() => void openNotificationMenu()}
          >
            <AppIcon icon={APP_ICONS.bell} />
            Notifications
            {unreadNotifications > 0 ? (
              <strong>{unreadNotificationLabel ?? unreadNotifications}</strong>
            ) : null}
          </button>
          {notificationMenuOpen ? <div id="notification-panel" className="notification-menu__panel" role="dialog" aria-label="Notifications">
            <div className="section-row">
              <strong>Latest updates</strong>
              <button
                type="button"
                className="notification-menu__close"
                onClick={() => setNotificationMenuOpen(false)}
                aria-label="Close notifications"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            {recentNotifications.length === 0 ? (
              <p className="muted">No updates yet.</p>
            ) : (
              <div className="notification-menu__list">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={notification.read ? "notification-menu__item" : "notification-menu__item notification-menu__item--unread"}
                  >
                    <span>{notification.type.replace("_", " ")}</span>
                    <strong>{notification.message}</strong>
                    <small>{notification.createdAtLabel}</small>
                  </div>
                ))}
              </div>
            )}
          </div> : null}
        </div>
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
        {navItems.map((item) => item.href === "/cart" ? (
          <button key={item.href} type="button" className="topbar-link" onClick={() => setCartDrawerOpen(true)}>
            <AppIcon icon={item.icon} />
            {item.label}
            {item.badge != null && item.badge > 0 ? <strong className="nav-item-badge">{item.badge}</strong> : null}
          </button>
        ) : (
          <Link
            key={item.href}
            href={item.href as Route}
            className={pathname === item.href ? "topbar-link topbar-link--active" : "topbar-link"}
          >
            <AppIcon icon={item.icon} />
            {item.label}
            {item.badge != null && item.badge > 0 ? <strong className="nav-item-badge">{item.badge}</strong> : null}
          </Link>
        ))}
      </nav>
    </header>
    <nav className="mobile-bottom-nav" aria-label="Main mobile navigation">
      {[navItems[0], navItems[1], navItems[2], navItems[4], navItems[5]].map((item) => item.href === "/cart" ? (
        <button key={item.href} type="button" className="mobile-bottom-nav__link" onClick={() => setCartDrawerOpen(true)}>
          <AppIcon icon={item.icon} />
          <span>{item.label}</span>
          {item.badge != null && item.badge > 0 ? <strong className="nav-item-badge">{item.badge}</strong> : null}
        </button>
      ) : (
        <Link
          key={item.href}
          href={item.href as Route}
          className={pathname === item.href ? "mobile-bottom-nav__link mobile-bottom-nav__link--active" : "mobile-bottom-nav__link"}
        >
          <AppIcon icon={item.icon} />
          <span>{item.label}</span>
          {item.badge != null && item.badge > 0 ? <strong className="nav-item-badge">{item.badge}</strong> : null}
        </Link>
      ))}
    </nav>
    <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
}

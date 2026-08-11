"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type CartSummary = {
  items: Array<{ id: string; name: string; quantity: number; totalLabel: string }>;
  totalLabel: string;
};

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const loading = open && cart === null;

  useEffect(() => {
    if (!open) return;
    fetch("/api/cart/summary", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ ok?: boolean } & CartSummary>)
      .then((payload) => setCart(payload.ok ? payload : { items: [], totalLabel: "" }))
      .catch(() => setCart({ items: [], totalLabel: "" }));
  }, [open]);

  if (!open) return null;

  return (
    <div className="cart-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Your cart" onMouseDown={(event) => event.stopPropagation()}>
        <div className="section-row">
          <h2>Your cart</h2>
          <button type="button" className="notification-menu__close" onClick={onClose} aria-label="Close cart">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {loading ? <p className="muted">Loading cart...</p> : null}
        {!loading && cart?.items.length === 0 ? <p className="muted">Your cart is empty.</p> : null}
        {!loading && cart?.items.length ? (
          <div className="cart-drawer__items">
            {cart.items.map((item) => (
              <div key={item.id} className="cart-drawer__item">
                <span>{item.quantity}x {item.name}</span>
                <strong>{item.totalLabel}</strong>
              </div>
            ))}
          </div>
        ) : null}
        <div className="cart-drawer__footer">
          {cart?.totalLabel ? <strong>Total: {cart.totalLabel}</strong> : <span />}
          <Link href="/cart" onClick={onClose} className="primary-link">Continue to checkout</Link>
        </div>
      </aside>
    </div>
  );
}

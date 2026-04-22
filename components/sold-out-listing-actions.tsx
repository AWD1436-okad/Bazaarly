"use client";

import { useEffect, useRef, useState } from "react";

type SoldOutListingActionsProps = {
  listingId: string;
  productName: string;
};

const LONG_PRESS_MS = 450;

export function SoldOutListingActions({
  listingId,
  productName,
}: SoldOutListingActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const timeoutRef = useRef<number | null>(null);

  function clearLongPress() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function beginLongPress() {
    clearLongPress();
    timeoutRef.current = window.setTimeout(() => {
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  }

  function handleDelete() {
    const confirmed = window.confirm("Delete this sold-out listing?");
    if (!confirmed) {
      return;
    }

    formRef.current?.requestSubmit();
  }

  useEffect(() => clearLongPress, []);

  return (
    <div
      className="sold-out-listing-actions"
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuOpen((current) => !current);
      }}
      onPointerDown={beginLongPress}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
    >
      <span className="stock-chip stock-chip--soldout">Sold out</span>
      <button
        type="button"
        className="ghost-button small sold-out-listing-actions__toggle"
        aria-label={`More actions for ${productName}`}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((current) => !current)}
      >
        More
      </button>
      {menuOpen ? (
        <div className="sold-out-listing-actions__menu">
          <button
            type="button"
            className="ghost-button small sold-out-listing-actions__delete"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      ) : null}
      <form ref={formRef} action="/listings/delete" method="post">
        <input type="hidden" name="listingId" value={listingId} />
      </form>
    </div>
  );
}

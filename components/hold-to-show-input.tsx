"use client";

import { Eye } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { useState } from "react";

type HoldToShowInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  revealLabel?: string;
};

export function HoldToShowInput({
  revealLabel = "Hold to show",
  disabled,
  onBlur,
  ...props
}: HoldToShowInputProps) {
  const [revealed, setRevealed] = useState(false);

  function show() {
    if (!disabled) {
      setRevealed(true);
    }
  }

  function hide() {
    setRevealed(false);
  }

  return (
    <span className="hold-to-show-input">
      <input
        {...props}
        disabled={disabled}
        type={revealed ? "text" : "password"}
        onBlur={(event) => {
          hide();
          onBlur?.(event);
        }}
      />
      <button
        type="button"
        className="hold-to-show-input__button"
        aria-label={revealLabel}
        disabled={disabled}
        onPointerDown={(event) => {
          event.preventDefault();
          show();
        }}
        onPointerUp={hide}
        onPointerCancel={hide}
        onPointerLeave={hide}
        onMouseDown={(event) => {
          event.preventDefault();
          show();
        }}
        onMouseUp={hide}
        onMouseLeave={hide}
        onTouchStart={(event) => {
          event.preventDefault();
          show();
        }}
        onTouchEnd={hide}
        onTouchCancel={hide}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            show();
          }
        }}
        onKeyUp={hide}
        onBlur={hide}
      >
        <Eye size={17} aria-hidden="true" />
      </button>
    </span>
  );
}

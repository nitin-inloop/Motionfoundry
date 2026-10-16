"use client";

import * as React from "react";
import styles from "../styles/credit-card.module.css";

export interface CreditCardProps {
  /** Issuer / brand text in the top-left corner */
  brand?: string;
  /** Card number (spaces are kept as typed) */
  number?: string;
  /** Cardholder name */
  holder?: string;
  /** Expiry date */
  expiry?: string;
  /** Glow color that follows the pointer */
  glowColor?: string;
  /** EMV chip color */
  chipColor?: string;
  /** Card surface color */
  cardColor?: string;
  /** Tilt the card in 3D toward the pointer */
  tilt?: boolean;
  /** Mask all but the last four digits */
  maskNumber?: boolean;
  /** Card width in pixels (height follows the ISO card ratio) */
  width?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const REST = { x: 0.5, y: 0.85 };

function masked(value: string): string {
  const digits = value.replace(/\D/g, "");
  const last = digits.slice(-4);
  return `•••• •••• •••• ${last}`;
}

export function CreditCard({
  brand = "MOTIONFOUNDRY",
  number = "4242 4242 4242 4242",
  holder = "ALEX MORGAN",
  expiry = "12/28",
  glowColor = "#ff8a1f",
  chipColor = "#9a5617",
  cardColor = "#1a1817",
  tilt = true,
  maskNumber = false,
  width = 380,
  className = "",
  style,
}: CreditCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const target = React.useRef({ ...REST, hover: 0 });
  const current = React.useRef({ ...REST, hover: 0 });
  const frame = React.useRef(0);
  const reduceMotion = React.useRef(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion.current = mq.matches;
    const onChange = () => (reduceMotion.current = mq.matches);
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  // Ease the glow (and tilt) toward the pointer; stop the loop once it settles.
  const tick = React.useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const t = target.current;
    const c = current.current;
    const k = reduceMotion.current ? 1 : 0.14;
    c.x += (t.x - c.x) * k;
    c.y += (t.y - c.y) * k;
    c.hover += (t.hover - c.hover) * k;
    el.style.setProperty("--mf-cc-x", `${(c.x * 100).toFixed(2)}%`);
    el.style.setProperty("--mf-cc-y", `${(c.y * 100).toFixed(2)}%`);
    el.style.setProperty("--mf-cc-hover", c.hover.toFixed(3));
    const tiltOn = tilt && !reduceMotion.current;
    el.style.setProperty("--mf-cc-rx", tiltOn ? `${((0.5 - c.y) * 14 * c.hover).toFixed(2)}deg` : "0deg");
    el.style.setProperty("--mf-cc-ry", tiltOn ? `${((c.x - 0.5) * 18 * c.hover).toFixed(2)}deg` : "0deg");
    const settled = Math.abs(t.x - c.x) + Math.abs(t.y - c.y) + Math.abs(t.hover - c.hover) < 0.001;
    frame.current = settled ? 0 : requestAnimationFrame(tick);
  }, [tilt]);

  const kick = () => {
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    target.current = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height, hover: 1 };
    kick();
  };

  const onPointerLeave = () => {
    target.current = { ...REST, hover: 0 };
    kick();
  };

  const shown = maskNumber ? masked(number) : number;
  const last4 = number.replace(/\D/g, "").slice(-4);

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      style={
        {
          "--mf-cc-width": `${width}px`,
          "--mf-cc-glow": glowColor,
          "--mf-cc-chip": chipColor,
          "--mf-cc-card": cardColor,
          ...style,
        } as React.CSSProperties
      }
    >
      <div
        ref={cardRef}
        role="img"
        aria-label={`${brand} card ending in ${last4}, ${holder}, expires ${expiry}`}
        className={styles.card}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <span className={styles.glow} aria-hidden="true" />
        <span className={styles.sheen} aria-hidden="true" />
        <div className={styles.top} aria-hidden="true">
          <span className={styles.brand}>{brand}</span>
          <span className={styles.chip}>
            <span />
            <span />
          </span>
        </div>
        <div className={styles.number} aria-hidden="true">
          {shown}
        </div>
        <div className={styles.bottom} aria-hidden="true">
          <span>{holder}</span>
          <span>{expiry}</span>
        </div>
      </div>
    </div>
  );
}

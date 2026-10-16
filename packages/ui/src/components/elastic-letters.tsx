"use client";

import * as React from "react";
import styles from "../styles/elastic-letters.module.css";

export interface ElasticLettersProps {
  /** Text whose letters react to the pointer */
  text?: string;
  /** Intensity of the pointer reaction (1 = default lift and stretch) */
  strength?: number;
  /** Radius of pointer influence in pixels */
  radius?: number;
  /** Spring stiffness; higher snaps back faster */
  stiffness?: number;
  /** Spring damping; lower values wobble longer */
  damping?: number;
  /** Play a staggered elastic drop-in when mounted */
  intro?: boolean;
  /** Tint that excited letters blend toward */
  accentColor?: string;
  /** Resting text color (defaults to the theme foreground) */
  color?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Element rendered as the root */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div";
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

interface LetterState {
  cx: number;
  cy: number;
  y: number;
  vy: number;
  s: number;
  vs: number;
  k: number;
  vk: number;
  release: number;
}

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function ElasticLetters({
  text = "Feel the spring",
  strength = 1,
  radius = 160,
  stiffness = 170,
  damping = 11,
  intro = true,
  accentColor = "#38bdf8",
  color,
  fontSize = 72,
  as = "h2",
  className = "",
  style,
}: ElasticLettersProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const words = React.useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-mf-el-char]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || els.length === 0) return;

    const lift = fontSize * 0.42;
    const states: LetterState[] = els.map((_, i) => ({
      cx: 0,
      cy: 0,
      y: intro ? -fontSize * 1.1 : 0,
      vy: 0,
      s: intro ? 0.2 : 1,
      vs: 0,
      k: 0,
      vk: 0,
      release: intro ? 0.08 + i * 0.045 : 0,
    }));

    const measure = () => {
      els.forEach((el, i) => {
        states[i].cx = el.offsetLeft + el.offsetWidth / 2;
        states[i].cy = el.offsetTop + el.offsetHeight / 2;
      });
    };
    measure();

    const render = (el: HTMLElement, st: LetterState, opacity: number) => {
      const sy = st.s;
      const sx = 1 + (st.s - 1) * 0.45;
      el.style.transform = `translate3d(0, ${st.y.toFixed(2)}px, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
      el.style.opacity = opacity >= 1 ? "" : opacity.toFixed(3);
      el.style.setProperty("--mf-el-k", Math.max(0, Math.min(1, st.k)).toFixed(3));
    };
    els.forEach((el, i) => render(el, states[i], intro ? 0 : 1));

    const pointer = { x: 0, y: 0, inside: false };
    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;
    const start = performance.now();
    const k = Math.max(1, stiffness);
    const c = Math.max(0, damping);
    const rad = Math.max(1, radius);

    const tick = (now: number) => {
      raf = 0;
      if (!visible) {
        running = false;
        return;
      }
      const dt = Math.min(1 / 30, Math.max(0.001, (now - last) / 1000));
      last = now;
      const t = (now - start) / 1000;
      let moving = false;
      states.forEach((st, i) => {
        const released = t >= st.release;
        let ty = st.y;
        let ts = st.s;
        let tk = 0;
        if (released) {
          let f = 0;
          if (pointer.inside) {
            const dx = pointer.x - st.cx;
            const dy = pointer.y - st.cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            f = Math.max(0, 1 - d / rad);
            f = f * f * (3 - 2 * f);
          }
          ty = -lift * strength * f;
          ts = 1 + 0.38 * strength * f;
          tk = f;
        } else {
          moving = true;
        }
        if (released) {
          // Semi-implicit Euler spring per channel.
          st.vy += (k * (ty - st.y) - c * st.vy) * dt;
          st.y += st.vy * dt;
          st.vs += (k * (ts - st.s) - c * st.vs) * dt;
          st.s += st.vs * dt;
          st.vk += (k * (tk - st.k) - c * 1.6 * st.vk) * dt;
          st.k += st.vk * dt;
          const restless =
            Math.abs(st.vy) > 0.05 ||
            Math.abs(ty - st.y) > 0.05 ||
            Math.abs(st.vs) > 0.001 ||
            Math.abs(ts - st.s) > 0.001 ||
            Math.abs(tk - st.k) > 0.002;
          if (restless) moving = true;
        }
        const opacity = released ? Math.min(1, (t - st.release) / 0.18) : 0;
        if (opacity < 1) moving = true;
        render(els[i], st, opacity);
      });
      if (moving || pointer.inside) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const wake = () => {
      if (running || !visible) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.inside = true;
      wake();
    };
    const onLeave = () => {
      pointer.inside = false;
      wake();
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      ro.observe(root);
    }
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) wake();
      });
      io.observe(root);
    }

    wake();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      ro?.disconnect();
      io?.disconnect();
      els.forEach((el) => {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.removeProperty("--mf-el-k");
      });
    };
  }, [text, strength, radius, stiffness, damping, intro, fontSize]);

  const Tag = as;
  const vars = {
    "--mf-el-size": `${fontSize}px`,
    "--mf-el-accent": accentColor,
    ...(color ? { "--mf-el-color": color } : {}),
    ...style,
  } as React.CSSProperties;

  let index = 0;
  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        rootRef.current = el;
      }}
      className={`${styles.root} ${className}`.trim()}
      style={vars}
    >
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true" className={styles.letters}>
        {words.map((word, wi) => (
          <React.Fragment key={`${word}-${wi}`}>
            <span className={styles.word}>
              {Array.from(word).map((ch) => {
                const i = index++;
                return (
                  <span key={i} className={styles.char} data-mf-el-char="">
                    {ch}
                  </span>
                );
              })}
            </span>
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useSpring } from "motion/react";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], label, summary, .nav-pill-item, .btn-primary, .btn-secondary, [data-cursor-interactive]';
const TEXT_SELECTOR =
  'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]';

const SPRING = { stiffness: 300, damping: 30, mass: 0.6 };

const finePointerQuery = "(pointer: fine)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToPointerEnv(onChange) {
  const fine = window.matchMedia(finePointerQuery);
  const reduced = window.matchMedia(reducedMotionQuery);
  fine.addEventListener("change", onChange);
  reduced.addEventListener("change", onChange);
  return () => {
    fine.removeEventListener("change", onChange);
    reduced.removeEventListener("change", onChange);
  };
}

function getPointerEnvEnabled() {
  return (
    window.matchMedia(finePointerQuery).matches &&
    !window.matchMedia(reducedMotionQuery).matches
  );
}

export function setCursorBusy(busy) {
  window.dispatchEvent(
    new CustomEvent("gridwise:cursor:busy", { detail: Boolean(busy) })
  );
}

export function setCursorMode(mode) {
  window.dispatchEvent(
    new CustomEvent("gridwise:cursor:mode", { detail: mode })
  );
}

export function CustomCursor() {
  const pathname = usePathname();

  const enabled = useSyncExternalStore(
    subscribeToPointerEnv,
    getPointerEnvEnabled,
    () => false
  );

  const [modeOverride, setModeOverride] = useState(null);
  const [variant, setVariant] = useState("default");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringX = useSpring(dotX, SPRING);
  const ringY = useSpring(dotY, SPRING);

  const surface =
    modeOverride === "reticle" || modeOverride === "halo"
      ? modeOverride
      : pathname === "/"
      ? "reticle"
      : "halo";

  useEffect(() => {
    if (!enabled) return;

    const onMode = (e) => {
      if (e.detail === "auto") {
        setModeOverride(null);
      } else if (e.detail === "reticle" || e.detail === "halo") {
        setModeOverride(e.detail);
      }
    };
    const onBusy = (e) => setBusy(Boolean(e.detail));

    const onMove = (e) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      setVisible((v) => v || true);
    };
    const onLeave = () => setVisible(false);
    const onOver = (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const next = t.closest(TEXT_SELECTOR)
        ? "text"
        : t.closest(INTERACTIVE_SELECTOR)
        ? "pointer"
        : "default";
      setVariant((v) => (v === next ? v : next));
    };

    window.addEventListener("gridwise:cursor:mode", onMode);
    window.addEventListener("gridwise:cursor:busy", onBusy);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerover", onOver, { passive: true });

    return () => {
      window.removeEventListener("gridwise:cursor:mode", onMode);
      window.removeEventListener("gridwise:cursor:busy", onBusy);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerover", onOver);
    };
  }, [enabled, dotX, dotY]);

  useEffect(() => {
    if (!enabled || surface !== "reticle") {
      delete document.body.dataset.cursorSurface;
      return;
    }
    document.body.dataset.cursorSurface = "landing";
  }, [enabled, surface]);

  if (!enabled) return null;

  const isReticle = surface === "reticle";

  return (
    <div aria-hidden="true">
      {isReticle && variant !== "text" && (
        <motion.div className="cursor-anchor" style={{ x: dotX, y: dotY }}>
          <div className="cursor-dot" data-visible={visible} />
        </motion.div>
      )}

      {isReticle && variant === "text" && (
        <motion.div className="cursor-anchor" style={{ x: ringX, y: ringY }}>
          <div className="cursor-text" data-visible={visible} />
        </motion.div>
      )}

      {isReticle && variant !== "text" && (
        <motion.div className="cursor-anchor" style={{ x: ringX, y: ringY }}>
          <div
            className={[
              "cursor-ring",
              variant === "pointer" ? "is-pointer" : "",
              busy ? "is-busy" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-visible={visible}
          >
            <span className="tick tick-n" />
            <span className="tick tick-s" />
            <span className="tick tick-e" />
            <span className="tick tick-w" />
            {busy && <span className="cursor-arc" />}
          </div>
        </motion.div>
      )}

      <motion.div className="cursor-anchor" style={{ x: ringX, y: ringY }}>
        <div
          className={[
            "cursor-halo",
            variant === "pointer" ? "is-pointer" : "",
            busy ? "is-busy" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-visible={visible}
          data-reticle={isReticle}
        />
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useSpring } from "motion/react";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], label, summary, .nav-pill-item, .btn-primary, .btn-secondary, [data-cursor-interactive]';
const TEXT_SELECTOR =
  'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]';

const SPRING = { stiffness: 300, damping: 30, mass: 0.6 };

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

  const [enabled, setEnabled] = useState(false);
  const [surface, setSurface] = useState("halo");
  const [variant, setVariant] = useState("default");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringX = useSpring(dotX, SPRING);
  const ringY = useSpring(dotY, SPRING);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => setEnabled(fine.matches && !reduced.matches);
    update();
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const computeSurface = (override) =>
      override === "reticle" || override === "halo"
        ? override
        : pathname === "/"
        ? "reticle"
        : "halo";

    const onMode = (e) => setSurface(computeSurface(e.detail));
    setSurface(computeSurface(document.body.dataset.cursor));
    window.addEventListener("gridwise:cursor:mode", onMode);

    const onBusy = (e) => setBusy(Boolean(e.detail));
    window.addEventListener("gridwise:cursor:busy", onBusy);

    const onMove = (e) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      setVisible(true);
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
  }, [enabled, pathname, dotX, dotY]);

  useEffect(() => {
    if (!enabled || surface !== "reticle") {
      delete document.body.dataset.cursorSurface;
      return;
    }
    document.body.dataset.cursorSurface = "landing";
  }, [enabled, surface]);

  if (!enabled) return null;

  const isReticle = surface === "reticle";
  const showReticleCore = isReticle && variant !== "text";

  return (
    <div aria-hidden="true">
      {showReticleCore && (
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

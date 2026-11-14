"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Decorative SVGs only: the hero's links and text keep their own pointer targets. */
export function HeroOrnaments() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const hero = scene?.closest<HTMLElement>(".landing-hero");
    if (!scene || !hero) return;

    const motion = window.matchMedia(
      "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
    );
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      scene.style.removeProperty("--scene-x");
      scene.style.removeProperty("--scene-y");
      scene.style.removeProperty("--scene-angle");
    };
    const draw = () => {
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((pointerX - bounds.left) / bounds.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((pointerY - bounds.top) / bounds.height - 0.5) * 2));
      scene.style.setProperty("--scene-x", `${x * 14}px`);
      scene.style.setProperty("--scene-y", `${y * 12}px`);
      scene.style.setProperty("--scene-angle", `${x * 18}deg`);
    };
    const move = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const syncMotion = () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", reset);
      reset();
      if (motion.matches) {
        hero.addEventListener("pointermove", move, { passive: true });
        hero.addEventListener("pointerleave", reset);
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) reset();
    };

    syncMotion();
    motion.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", reset);
      motion.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reset();
    };
  }, []);

  return (
    <div ref={sceneRef} className="hero-art" aria-hidden="true">
      <Ornament name="pill-left" spinning><Capsule /></Ornament>
      <Ornament name="syringe-left" spinning><Syringe /></Ornament>
      <Ornament name="pill-right" spinning><Capsule /></Ornament>
      <Ornament name="syringe-right" spinning><Syringe /></Ornament>
      <Ornament name="capsule"><Capsule /></Ornament>
      <Ornament name="cross"><MedicalCross /></Ornament>
    </div>
  );
}

function Ornament({
  name,
  spinning = false,
  children,
}: {
  name: string;
  spinning?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`hero-art__object hero-art__object--${name}`}>
      <div className="hero-art__float">
        {spinning ? <div className="hero-art__spin">{children}</div> : children}
      </div>
    </div>
  );
}

function Syringe() {
  return (
    <svg viewBox="0 0 180 200" focusable="false" className="hero-art__drawing hero-art__instrument">
      <path d="M90 159v28" />
      <path d="m82 145 3 14h10l3-14" className="hero-art__paper" />
      <rect x="63" y="59" width="54" height="86" rx="12" className="hero-art__paper" />
      <path d="M70 107h40v25a6 6 0 0 1-6 6H76a6 6 0 0 1-6-6Z" className="hero-art__accent" />
      <path d="M76 59V36h28v23" className="hero-art__paper" />
      <rect x="61" y="25" width="58" height="13" rx="6.5" className="hero-art__solid" />
      <path d="M54 59h72M101 77h10M104 87h7M101 97h10M104 107h7M101 117h10" />
      <path d="M72 74v21" className="hero-art__shine" />
    </svg>
  );
}

function Capsule() {
  return (
    <svg viewBox="0 0 128 128" focusable="false" className="hero-art__drawing hero-art__instrument">
      <g transform="rotate(-35 64 64)">
        <rect x="40" y="16" width="48" height="96" rx="24" className="hero-art__paper" />
        <path d="M40 64h48v24a24 24 0 0 1-48 0Z" className="hero-art__solid" />
        <path d="M49 49v-9a15 15 0 0 1 15-15" className="hero-art__shine" />
        <path d="M40 64h48" />
      </g>
    </svg>
  );
}

function MedicalCross() {
  return (
    <svg viewBox="0 0 100 100" focusable="false" className="hero-art__drawing hero-art__instrument">
      <rect x="12" y="12" width="76" height="76" rx="24" className="hero-art__paper" />
      <path d="M41 29h18v12h12v18H59v12H41V59H29V41h12Z" className="hero-art__solid" />
    </svg>
  );
}

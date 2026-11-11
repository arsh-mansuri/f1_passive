"use client";

import { useEffect, useRef } from "react";

type InteractiveBackgroundProps = {
  className?: string;
  variant?: "landing" | "dashboard" | "race";
  density?: number;
  fixed?: boolean;
};

type Mote = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  red: boolean;
  phase: number;
  boost: number;
};

type Streak = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  width: number;
  red: boolean;
};

const RED = [225, 6, 0] as const;
const WHITE = [245, 245, 245] as const;

function rgba(color: readonly [number, number, number], alpha: number) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

export function InteractiveBackground({
  className = "",
  variant = "landing",
  density = 1,
  fixed = false,
}: InteractiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasNode = canvasRef.current;
    if (!canvasNode) return;

    const contextNode = canvasNode.getContext("2d");
    if (!contextNode) return;

    const canvasEl: HTMLCanvasElement = canvasNode;
    const ctx: CanvasRenderingContext2D = contextNode;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let onScreen = true;
    let last = 0;
    let spawnTimer = 0;

    const motes: Mote[] = [];
    const streaks: Streak[] = [];

    const pointer = {
      x: 0,
      y: 0,
      tx: 0,
      ty: 0,
      active: false,
    };

    function buildMotes() {
      motes.length = 0;
      const target = Math.max(
        26,
        Math.min(96, Math.round(((width * height) / 26000) * density)),
      );

      for (let index = 0; index < target; index += 1) {
        motes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.7 + 0.5,
          alpha: Math.random() * 0.42 + 0.12,
          red: Math.random() > 0.55,
          phase: Math.random() * Math.PI * 2,
          boost: 0,
        });
      }
    }

    function resize() {
      const rect = canvasEl.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvasEl.width = Math.floor(width * dpr);
      canvasEl.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (pointer.x === 0 && pointer.y === 0) {
        pointer.x = width * 0.68;
        pointer.y = height * 0.38;
        pointer.tx = pointer.x;
        pointer.ty = pointer.y;
      }

      buildMotes();
      if (reduced) drawStatic();
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const mote of motes) {
        const color = mote.red ? RED : WHITE;
        ctx.beginPath();
        ctx.fillStyle = rgba(color, mote.alpha * 0.8);
        ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    }

    function spawnStreak() {
      const fromLeft = Math.random() > 0.5;
      const angle = (Math.random() - 0.5) * 0.42;
      const speed = 9 + Math.random() * 11;
      const y = Math.random() * height;
      streaks.push({
        x: fromLeft ? -80 : width + 80,
        y,
        vx: fromLeft ? speed : -speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 46 + Math.random() * 34,
        width: 0.6 + Math.random() * 1.4,
        red: Math.random() > 0.4,
      });
    }

    function frame(timestamp: number) {
      if (!running || !onScreen) return;

      if (!last) last = timestamp;
      const delta = Math.min(2.4, (timestamp - last) / 16.6667);
      last = timestamp;

      pointer.x += (pointer.tx - pointer.x) * Math.min(1, 0.08 * delta);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, 0.08 * delta);

      ctx.clearRect(0, 0, width, height);

      if (pointer.active) {
        const glow = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          Math.max(width, height) * 0.34,
        );
        glow.addColorStop(0, rgba(RED, 0.11));
        glow.addColorStop(0.42, rgba(RED, 0.045));
        glow.addColorStop(1, rgba(RED, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.globalCompositeOperation = "lighter";

      const influence = variant === "dashboard" ? 230 : 260;
      const influenceSq = influence * influence;

      for (const mote of motes) {
        if (pointer.active) {
          const dx = pointer.x - mote.x;
          const dy = pointer.y - mote.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < influenceSq && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const falloff = 1 - dist / influence;
            const force = falloff * falloff * 0.045 * delta;
            mote.vx += (-dy / dist) * force;
            mote.vy += (dx / dist) * force;
            mote.boost = Math.max(mote.boost, falloff);
          }
        }

        mote.phase += 0.008 * delta;
        mote.boost *= 1 - 0.03 * delta;

        mote.vx += Math.cos(mote.phase) * 0.0016 * delta;
        mote.vy += Math.sin(mote.phase * 0.8) * 0.0016 * delta;

        mote.vx *= 1 - 0.004 * delta;
        mote.vy *= 1 - 0.004 * delta;

        const speed = Math.hypot(mote.vx, mote.vy);
        const maxSpeed = 1.5;
        if (speed > maxSpeed) {
          mote.vx = (mote.vx / speed) * maxSpeed;
          mote.vy = (mote.vy / speed) * maxSpeed;
        }

        const previousX = mote.x;
        const previousY = mote.y;
        mote.x += mote.vx * delta * 3.2;
        mote.y += mote.vy * delta * 3.2;

        const margin = 24;
        if (mote.x < -margin) mote.x = width + margin;
        if (mote.x > width + margin) mote.x = -margin;
        if (mote.y < -margin) mote.y = height + margin;
        if (mote.y > height + margin) mote.y = -margin;

        const color = mote.red ? RED : WHITE;
        const alpha = Math.min(0.9, mote.alpha + mote.boost * 0.45);

        ctx.beginPath();
        ctx.strokeStyle = rgba(color, alpha * 0.3);
        ctx.lineWidth = mote.r * 0.9;
        ctx.lineCap = "round";
        ctx.moveTo(previousX, previousY);
        ctx.lineTo(mote.x, mote.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = rgba(color, alpha);
        ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
        ctx.fill();

        if (mote.boost > 0.25) {
          ctx.beginPath();
          ctx.fillStyle = rgba(color, mote.boost * 0.16);
          ctx.arc(mote.x, mote.y, mote.r * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      spawnTimer += delta;
      if (spawnTimer > 44) {
        spawnTimer = 0;
        if (streaks.length < 4) spawnStreak();
      }

      for (let index = streaks.length - 1; index >= 0; index -= 1) {
        const streak = streaks[index];
        streak.life += delta;
        streak.x += streak.vx * delta * 1.9;
        streak.y += streak.vy * delta * 1.9;

        const progress = streak.life / streak.maxLife;
        const fade = Math.sin(Math.min(1, progress) * Math.PI);
        const color = streak.red ? RED : WHITE;
        const tail = Math.min(180, Math.abs(streak.vx) * 9);

        const gradient = ctx.createLinearGradient(
          streak.x,
          streak.y,
          streak.x - Math.sign(streak.vx) * tail,
          streak.y - Math.sign(streak.vy) * tail * 0.4,
        );
        gradient.addColorStop(0, rgba(color, 0.55 * fade));
        gradient.addColorStop(1, rgba(color, 0));

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = streak.width;
        ctx.lineCap = "round";
        ctx.moveTo(streak.x, streak.y);
        ctx.lineTo(
          streak.x - Math.sign(streak.vx) * tail,
          streak.y - Math.sign(streak.vy) * tail * 0.4,
        );
        ctx.stroke();

        if (
          streak.life > streak.maxLife ||
          streak.x < -260 ||
          streak.x > width + 260
        ) {
          streaks.splice(index, 1);
        }
      }

      ctx.globalCompositeOperation = "source-over";

      raf = window.requestAnimationFrame(frame);
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = canvasEl.getBoundingClientRect();
      pointer.tx = event.clientX - rect.left;
      pointer.ty = event.clientY - rect.top;
      pointer.active = true;
    }

    function handlePointerLeave() {
      pointer.active = false;
    }

    function handleVisibility() {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        last = 0;
        raf = window.requestAnimationFrame(frame);
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!onScreen) {
            onScreen = true;
            last = 0;
            if (running && !reduced) {
              raf = window.requestAnimationFrame(frame);
            }
          }
        } else {
          onScreen = false;
          window.cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(canvasEl);

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", handlePointerLeave);
    document.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibility);

    if (reduced) {
      drawStatic();
    } else {
      raf = window.requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      observer.disconnect();
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handlePointerLeave);
      document.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [density, variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none ${
        fixed ? "fixed" : "absolute"
      } inset-0 h-full w-full ${className}`}
    />
  );
}

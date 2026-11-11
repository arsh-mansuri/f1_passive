"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { buildPathD, buildTrackGeometry, pointAtFraction } from "@/lib/track";
import type { TrackPoint } from "@/lib/types";

type MiniDot = {
  fraction: number;
  color: string;
  code?: string;
  delay?: number;
};

type MiniTrackProps = {
  points: TrackPoint[];
  dots?: MiniDot[];
  className?: string;
  strokeWidth?: number;
  showStartLine?: boolean;
  glow?: boolean;
  live?: boolean;
};

export function MiniTrack({
  points,
  dots = [],
  className = "",
  strokeWidth = 9,
  showStartLine = true,
  glow = true,
  live = true,
}: MiniTrackProps) {
  const rawId = useId();
  const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId]);
  const glowId = `mini-glow-${uid}`;
  const haloId = `mini-halo-${uid}`;

  const geometry = useMemo(() => buildTrackGeometry(points), [points]);
  const path = useMemo(() => buildPathD(points), [points]);
  const start = useMemo(() => pointAtFraction(geometry, 0), [geometry]);
  const ahead = useMemo(() => pointAtFraction(geometry, 0.004), [geometry]);

  const dotRefs = useRef<Array<SVGGElement | null>>([]);

  useEffect(() => {
    if (!live || dots.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = 0;
    let elapsed = 0;

    const loop = (timestamp: number) => {
      if (!last) last = timestamp;
      const delta = Math.min(0.05, (timestamp - last) / 1000);
      last = timestamp;
      elapsed += delta;

      for (let index = 0; index < dots.length; index += 1) {
        const group = dotRefs.current[index];
        if (!group) continue;
        const dot = dots[index];
        const speed = 0.012 + (index % 4) * 0.0026;
        const fraction = (dot.fraction + elapsed * speed) % 1;
        const point = pointAtFraction(geometry, fraction);
        group.setAttribute(
          "transform",
          `translate(${40 + point.x * 920} ${40 + point.y * 920})`,
        );
      }

      raf = window.requestAnimationFrame(loop);
    };

    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [dots, geometry, live]);

  return (
    <svg
      viewBox="0 0 1000 1000"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <filter
          id={glowId}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E10600" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#E10600" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="500" cy="500" r="470" fill={`url(#${haloId})`} />

      {glow ? (
        <path
          d={path}
          fill="none"
          stroke="#E10600"
          strokeWidth={strokeWidth * 3}
          strokeOpacity="0.06"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />
      ) : null}

      <path
        d={path}
        fill="none"
        stroke="#181818"
        strokeWidth={strokeWidth * 2.2}
        strokeLinejoin="round"
        pathLength={1}
        className="mini-track-draw"
      />
      <path
        d={path}
        fill="none"
        stroke="#3A3A3A"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        pathLength={1}
        className="mini-track-draw"
        style={{ animationDelay: "0.08s" }}
      />
      <path
        d={path}
        fill="none"
        stroke="#565656"
        strokeWidth={strokeWidth * 0.12}
        strokeDasharray="2 16"
        strokeLinecap="round"
        className="racing-dash"
      />

      {showStartLine ? (
        <g>
          <line
            x1={40 + start.x * 920}
            y1={40 + start.y * 920}
            x2={40 + start.x * 920 + (ahead.y - start.y) * 260}
            y2={40 + start.y * 920 - (ahead.x - start.x) * 260}
            stroke="#F5F5F5"
            strokeWidth="5"
            strokeOpacity="0.6"
          />
        </g>
      ) : null}

      {dots.map((dot, index) => {
        const point = pointAtFraction(geometry, dot.fraction);
        return (
          <g
            key={`${dot.fraction}-${dot.color}-${index}`}
            ref={(node) => {
              dotRefs.current[index] = node;
            }}
            transform={`translate(${40 + point.x * 920} ${40 + point.y * 920})`}
            className="animate-soft-pulse"
            style={{ animationDelay: `${dot.delay ?? index * 0.45}s` }}
          >
            <circle r="26" fill={dot.color} opacity="0.14" />
            <circle r="13" fill={dot.color} stroke="#0A0A0A" strokeWidth="5" />
          </g>
        );
      })}
    </svg>
  );
}

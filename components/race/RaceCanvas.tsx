"use client";

import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildPathD,
  buildTrackGeometry,
  pointAtFraction,
  toViewBox,
} from "@/lib/track";
import { lapProgressAt, positionsAt } from "@/lib/race";
import type { Race } from "@/lib/types";

export type RaceCanvasHandle = {
  render: (t: number) => void;
  reset: (t?: number) => void;
};

type RaceCanvasProps = {
  race: Race;
  className?: string;
};

type DotState = {
  rank: number;
};

const POSITION_SPACING = 0.0072;

export const RaceCanvas = forwardRef<RaceCanvasHandle, RaceCanvasProps>(
  function RaceCanvas({ race, className = "" }, ref) {
    const rawId = useId();
    const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId]);
    const bgId = `race-bg-${uid}`;
    const haloId = `race-halo-${uid}`;
    const gridId = `race-grid-${uid}`;
    const shadowId = `track-shadow-${uid}`;
    const dotGlowId = `dot-glow-${uid}`;
    const cometGlowId = `comet-glow-${uid}`;

    const geometry = useMemo(
      () => buildTrackGeometry(race.trackPoints),
      [race.trackPoints],
    );
    const pathD = useMemo(() => buildPathD(race.trackPoints), [race.trackPoints]);

    const startLine = useMemo(() => {
      const start = pointAtFraction(geometry, 0);
      const ahead = pointAtFraction(geometry, 0.006);
      const dx = ahead.x - start.x;
      const dy = ahead.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      const half = 0.03;

      return {
        from: toViewBox({ x: start.x + nx * half, y: start.y + ny * half }),
        to: toViewBox({ x: start.x - nx * half, y: start.y - ny * half }),
      };
    }, [geometry]);

    const sectorMarkers = useMemo(
      () =>
        [1 / 3, 2 / 3].map((fraction) =>
          toViewBox(pointAtFraction(geometry, fraction)),
        ),
      [geometry],
    );

    const [hovered, setHovered] = useState<string | null>(null);
    const groupRefs = useRef<Record<string, SVGGElement | null>>({});
    const dotStates = useRef<Record<string, DotState>>({});
    const lastT = useRef<number | null>(null);

    const render = useCallback(
      (t: number) => {
        const positions = positionsAt(race.frames, t);
        const previousT = lastT.current;

        if (previousT !== null && t < previousT) {
          dotStates.current = {};
        }

        const elapsed =
          previousT === null ? 0 : Math.max(0, Math.min(0.5, t - previousT));
        const alpha = previousT === null ? 1 : 1 - Math.exp(-11 * elapsed);
        const lapProgress = lapProgressAt(race, t);

        for (const driver of race.drivers) {
          const code = driver.code;
          const target = positions[code] ?? race.drivers.length;
          const state = dotStates.current[code];
          let displayed = target;

          if (state) {
            const delta = target - state.rank;
            if (Math.abs(delta) > 2.5) {
              displayed = target;
            } else {
              displayed = state.rank + delta * alpha;
            }
          }

          dotStates.current[code] = { rank: displayed };

          const fraction = lapProgress - (displayed - 1) * POSITION_SPACING;
          const point = toViewBox(pointAtFraction(geometry, fraction));
          const wrapped = ((fraction % 1) + 1) % 1;

          let opacity = 1;
          if (t > 2) {
            const fade = 0.008;
            if (wrapped < fade) opacity = 0.1 + (wrapped / fade) * 0.9;
            else if (wrapped > 1 - fade) {
              opacity = 0.1 + ((1 - wrapped) / fade) * 0.9;
            }
          }

          const group = groupRefs.current[code];
          if (group) {
            group.setAttribute(
              "transform",
              `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`,
            );
            group.style.opacity = String(opacity);
          }
        }

        lastT.current = t;
      },
      [geometry, race],
    );

    const reset = useCallback(
      (t = 0) => {
        dotStates.current = {};
        lastT.current = null;
        render(t);
      },
      [render],
    );

    useImperativeHandle(ref, () => ({ render, reset }), [render, reset]);

    useLayoutEffect(() => {
      reset(0);
    }, [reset]);

    return (
      <div className={`relative h-full w-full ${className}`}>
        <svg
          viewBox="0 0 1000 1000"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${race.circuit} circuit with live driver positions`}
        >
          <defs>
            <radialGradient id={bgId} cx="50%" cy="48%" r="68%">
              <stop offset="0%" stopColor="#131313" />
              <stop offset="62%" stopColor="#0b0b0b" />
              <stop offset="100%" stopColor="#070707" />
            </radialGradient>
            <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E10600" stopOpacity="0.085" />
              <stop offset="68%" stopColor="#E10600" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#E10600" stopOpacity="0" />
            </radialGradient>
            <pattern
              id={gridId}
              width="56"
              height="56"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 56 0 L 0 0 0 56"
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.03"
                strokeWidth="1"
              />
            </pattern>
            <filter
              id={shadowId}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="10" />
            </filter>
            <filter
              id={dotGlowId}
              x="-200%"
              y="-200%"
              width="500%"
              height="500%"
            >
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <filter
              id={cometGlowId}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          <rect width="1000" height="1000" fill={`url(#${bgId})`} />
          <rect
            width="1000"
            height="1000"
            fill={`url(#${gridId})`}
            opacity="0.65"
          />
          <circle cx="500" cy="500" r="480" fill={`url(#${haloId})`} />

          <g
            className="animate-spin-slow"
            style={{ transformOrigin: "500px 500px" }}
          >
            <circle
              cx="500"
              cy="500"
              r="438"
              fill="none"
              stroke="#E10600"
              strokeOpacity="0.07"
              strokeWidth="1"
              strokeDasharray="2 20"
            />
          </g>
          <g
            className="animate-spin-slow-reverse"
            style={{ transformOrigin: "500px 500px" }}
          >
            <circle
              cx="500"
              cy="500"
              r="472"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.04"
              strokeWidth="1"
              strokeDasharray="1 30"
            />
          </g>

          <path
            d={pathD}
            fill="none"
            stroke="#000000"
            strokeWidth="34"
            strokeLinejoin="round"
            opacity="0.7"
            filter={`url(#${shadowId})`}
          />
          <path
            d={pathD}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="22"
            strokeLinejoin="round"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#2c2c2c"
            strokeWidth="13"
            strokeLinejoin="round"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#484848"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="2 16"
            opacity="0.8"
            className="racing-dash"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#E10600"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.85"
            pathLength={1}
            filter={`url(#${cometGlowId})`}
            className="track-comet"
          />

          <line
            x1={startLine.from.x}
            y1={startLine.from.y}
            x2={startLine.to.x}
            y2={startLine.to.y}
            stroke="#F5F5F5"
            strokeWidth="4"
            strokeOpacity="0.65"
          />
          <line
            x1={startLine.from.x}
            y1={startLine.from.y}
            x2={startLine.to.x}
            y2={startLine.to.y}
            stroke="#0A0A0A"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            strokeOpacity="0.9"
          />

          {sectorMarkers.map((point, index) => (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r="13" fill="#E10600" opacity="0.06" />
              <circle cx={point.x} cy={point.y} r="2.4" fill="#E10600" opacity="0.4" />
            </g>
          ))}

          {race.drivers.map((driver) => {
            const isHovered = hovered === driver.code;
            return (
              <g
                key={driver.code}
                ref={(node) => {
                  groupRefs.current[driver.code] = node;
                }}
                className="cursor-default"
                onPointerEnter={() => setHovered(driver.code)}
                onPointerLeave={() =>
                  setHovered((current) =>
                    current === driver.code ? null : current,
                  )
                }
              >
                <circle
                  r={isHovered ? 19 : 16}
                  fill={driver.color}
                  opacity={isHovered ? 0.26 : 0.13}
                  filter={`url(#${dotGlowId})`}
                />
                <circle
                  r="8.4"
                  fill={driver.color}
                  stroke="#080808"
                  strokeWidth="2.4"
                />
                <circle
                  r="8.4"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeOpacity={isHovered ? 0.65 : 0.18}
                />
                {isHovered ? (
                  <g
                    transform="translate(18 -66)"
                    style={{ pointerEvents: "none" }}
                  >
                    <rect
                      width="158"
                      height="52"
                      rx="12"
                      fill="#0b0b0b"
                      stroke={driver.color}
                      strokeOpacity="0.5"
                      strokeWidth="1"
                    />
                    <rect
                      x="0"
                      y="12"
                      width="3"
                      height="28"
                      rx="1.5"
                      fill={driver.color}
                    />
                    <text
                      x="14"
                      y="24"
                      fontSize="18"
                      fontWeight="700"
                      letterSpacing="0.6"
                      fill="#F5F5F5"
                    >
                      {driver.code}
                    </text>
                    <text x="14" y="40" fontSize="11" fill="#8a8a8a">
                      {driver.team}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    );
  },
);

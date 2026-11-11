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
};

export function MiniTrack({
  points,
  dots = [],
  className = "",
  strokeWidth = 9,
  showStartLine = true,
  glow = true,
}: MiniTrackProps) {
  const geometry = buildTrackGeometry(points);
  const path = buildPathD(points);
  const start = pointAtFraction(geometry, 0);
  const ahead = pointAtFraction(geometry, 0.004);

  return (
    <svg
      viewBox="0 0 1000 1000"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <filter id="mini-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="mini-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E10600" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#E10600" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="500" cy="500" r="470" fill="url(#mini-halo)" />

      {glow ? (
        <path
          d={path}
          fill="none"
          stroke="#E10600"
          strokeWidth={strokeWidth * 3}
          strokeOpacity="0.06"
          strokeLinejoin="round"
          filter="url(#mini-glow)"
        />
      ) : null}

      <path
        d={path}
        fill="none"
        stroke="#181818"
        strokeWidth={strokeWidth * 2.2}
        strokeLinejoin="round"
      />
      <path
        d={path}
        fill="none"
        stroke="#3A3A3A"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d={path}
        fill="none"
        stroke="#565656"
        strokeWidth={strokeWidth * 0.12}
        strokeDasharray="2 16"
        strokeLinecap="round"
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
            className="animate-soft-pulse"
            style={{ animationDelay: `${dot.delay ?? index * 0.45}s` }}
          >
            <circle
              cx={40 + point.x * 920}
              cy={40 + point.y * 920}
              r="26"
              fill={dot.color}
              opacity="0.14"
            />
            <circle
              cx={40 + point.x * 920}
              cy={40 + point.y * 920}
              r="13"
              fill={dot.color}
              stroke="#0A0A0A"
              strokeWidth="5"
            />
          </g>
        );
      })}
    </svg>
  );
}

import Link from "next/link";

type LogoProps = {
  href?: string;
  className?: string;
  showWordmark?: boolean;
};

export function Logo({
  href = "/",
  className = "",
  showWordmark = true,
}: LogoProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 ${className}`}
      aria-label="PitWall home"
    >
      <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-[10px] bg-pit-red shadow-red-glow-sm transition-transform duration-300 group-hover:scale-105">
        <svg
          viewBox="0 0 32 32"
          className="h-full w-full"
          aria-hidden="true"
        >
          <path
            d="M7 24c0-6 4.8-11 11-11h2.5a4.5 4.5 0 0 0 4.5-4.5V7"
            fill="none"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity=".92"
          />
          <path
            d="M6 27c0-2.2 1.8-4 4-4h5c7.7 0 14-6.3 14-14V7"
            fill="none"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity=".35"
          />
          <circle cx="24" cy="21" r="2.1" fill="white" />
        </svg>
      </span>
      {showWordmark ? (
        <span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-pit-text">
          PIT<span className="text-pit-red">WALL</span>
        </span>
      ) : null}
    </Link>
  );
}

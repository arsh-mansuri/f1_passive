import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="noise relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-pit-black px-6">
      <div className="absolute inset-0 grid-lines opacity-60" />
      <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pit-red/[0.06] blur-[110px]" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Logo showWordmark />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-pit-red">
          404 · Off track
        </p>
        <h1 className="mt-4 font-display text-4xl leading-[0.95] text-white sm:text-5xl">
          You&apos;ve gone off the racing line.
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/40">
          That page isn&apos;t on the timing sheet. Head back to the paddock and
          pick a race.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-xl bg-pit-red px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#ff1a12]"
          >
            Back to the paddock
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-5 py-3 text-[11px] font-medium text-white/55 transition-colors hover:border-white/25 hover:text-white"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}

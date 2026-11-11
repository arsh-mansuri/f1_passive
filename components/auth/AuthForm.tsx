"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/ui/icons";

type AuthFormProps = {
  mode: "login" | "signup";
  configured: boolean;
  next: string;
  initialError?: string;
};

function friendlyError(value: string): string {
  if (value === "supabase_not_configured") {
    return "Supabase is not configured. Add your project URL and anon key to .env.local.";
  }
  if (value === "auth_callback_failed") {
    return "We could not complete that sign-in. Please try again.";
  }
  return value;
}

export function AuthForm({
  mode,
  configured,
  next,
  initialError,
}: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(
    initialError ? friendlyError(initialError) : "",
  );
  const [message, setMessage] = useState("");

  const isSignup = mode === "signup";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) {
      setError(
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.",
      );
      return;
    }

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = getBrowserSupabase();

      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session) {
          router.push(next);
          router.refresh();
          return;
        }

        setMessage(
          "Check your inbox to confirm your email, then sign in. (Disable email confirmation in Supabase for instant local signups.)",
        );
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!configured) {
      setError(
        "Supabase is not configured yet. Add your environment variables to enable Google sign-in.",
      );
      return;
    }

    setError("");
    setGoogleLoading(true);

    try {
      const supabase = getBrowserSupabase();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
      setGoogleLoading(false);
    }
  }

  return (
    <div>
      {!configured ? (
        <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-[12px] leading-5 text-amber-200/80">
          <p className="font-semibold uppercase tracking-[0.14em] text-amber-200/90">
            Supabase not configured
          </p>
          <p className="mt-1.5">
            Add <code className="text-amber-100">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="text-amber-100">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            to <code className="text-amber-100">.env.local</code>, then restart.
            See the README for the full setup.
          </p>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-pit-red/30 bg-pit-red/[0.08] px-4 py-3 text-[12px] leading-5 text-red-200"
        >
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-[12px] leading-5 text-emerald-200/90">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Email
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-pit-red/60 focus:bg-white/[0.04]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Password
          </span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignup ? "At least 6 characters" : "Your password"}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 pr-16 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-pit-red/60 focus:bg-white/[0.04]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 transition-colors hover:text-white/70"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pit-red text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-red-glow-sm transition-all duration-300 hover:bg-[#ff1a12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {isSignup ? "Creating account" : "Signing in"}
            </>
          ) : isSignup ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/25">
          or
        </span>
        <span className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading || googleLoading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] text-[12px] font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {googleLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <GoogleIcon className="h-[18px] w-[18px]" />
        )}
        Continue with Google
      </button>

      <p className="mt-8 text-center text-[12px] text-pit-muted">
        {isSignup ? "Already in the paddock?" : "New to PitWall?"}{" "}
        <Link
          href={
            isSignup
              ? `/login?next=${encodeURIComponent(next)}`
              : `/signup?next=${encodeURIComponent(next)}`
          }
          className="font-medium text-white underline decoration-white/20 underline-offset-4 transition-colors hover:decoration-pit-red"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

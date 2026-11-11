import { cache } from "react";
import { redirect } from "next/navigation";
import type { SessionUser } from "./types";
import { isDemoMode } from "./supabase/config";
import { createServerSupabase } from "./supabase/server";

const DEMO_USER: SessionUser = {
  id: "demo-driver",
  email: "demo@pitwall.local",
  demo: true,
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (isDemoMode) return DEMO_USER;

  const supabase = createServerSupabase();
  if (!supabase) return null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return {
      id: user.id,
      email: user.email ?? "driver@pitwall",
      demo: false,
    };
  } catch {
    return null;
  }
});

export async function requireUser(nextPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

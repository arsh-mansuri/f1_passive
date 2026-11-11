import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthForm } from "@/components/auth/AuthForm";
import { getSessionUser, safeNextPath } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to PitWall and pick your race.",
};

type LoginPageProps = {
  searchParams: {
    next?: string;
    error?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const next = safeNextPath(searchParams.next);
  const error =
    typeof searchParams.error === "string" ? searchParams.error : undefined;

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Back to the wall."
      subtitle="Sign in to pick a race, hit lights out, and keep one eye on the timing tower."
    >
      <AuthForm
        mode="login"
        configured={isSupabaseConfigured}
        next={next}
        initialError={error}
      />
    </AuthLayout>
  );
}

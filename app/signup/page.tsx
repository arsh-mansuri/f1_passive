import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthForm } from "@/components/auth/AuthForm";
import { getSessionUser, safeNextPath } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Create account",
  description: "Join PitWall and start replaying races.",
};

type SignupPageProps = {
  searchParams: {
    next?: string;
    error?: string;
  };
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const next = safeNextPath(searchParams.next);
  const error =
    typeof searchParams.error === "string" ? searchParams.error : undefined;

  return (
    <AuthLayout
      eyebrow="Join the paddock"
      title="Start your replay."
      subtitle="One account, every race in the archive. Email and password, or continue with Google."
    >
      <AuthForm
        mode="signup"
        configured={isSupabaseConfigured}
        next={next}
        initialError={error}
      />
    </AuthLayout>
  );
}

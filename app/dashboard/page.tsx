import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { requireUser } from "@/lib/auth";
import { raceCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The paddock",
  description: "Pick an F1 race and hit lights out.",
};

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");

  return <DashboardClient races={raceCatalog} user={user} />;
}

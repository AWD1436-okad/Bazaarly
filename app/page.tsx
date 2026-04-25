import { redirect } from "next/navigation";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";

export default async function HomeEntryPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  redirect((hasCompletedSecuritySetup(user) ? "/marketplace" : "/security-setup") as never);
}

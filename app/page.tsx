import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";

export default async function HomeEntryPage() {
  const user = await getSessionUser();

  redirect(user ? "/marketplace" : "/login");
}

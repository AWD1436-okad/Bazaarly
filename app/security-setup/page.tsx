import { redirect } from "next/navigation";

import { SecuritySetupLock } from "@/components/security-setup-lock";
import { hasCompletedSecuritySetup, requireUser } from "@/lib/auth";

type SecuritySetupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SecuritySetupPage({ searchParams }: SecuritySetupPageProps) {
  const user = await requireUser({ allowIncompleteSecurity: true });

  if (hasCompletedSecuritySetup(user)) {
    redirect(user.shop ? "/dashboard" : "/onboarding/shop");
  }

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="auth-layout">
      <SecuritySetupLock error={error} />
    </main>
  );
}

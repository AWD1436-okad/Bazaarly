import { redirect } from "next/navigation";

import { SecuritySetupLock } from "@/components/security-setup-lock";
import { hasCompletedSecuritySetup, requireUser } from "@/lib/auth";
import { decryptBankNumber } from "@/lib/pin";
import { prisma } from "@/lib/prisma";

type SecuritySetupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SecuritySetupPage({ searchParams }: SecuritySetupPageProps) {
  const user = await requireUser({ allowIncompleteSecurity: true });
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;
  const reveal = params.reveal === "1";
  const continueHref = user.shop ? "/dashboard" : "/onboarding/shop";

  if (hasCompletedSecuritySetup(user)) {
    if (!reveal) {
      redirect(continueHref);
    }

    const authUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        bankNumberEncrypted: true,
      },
    });
    const completedBankNumber = decryptBankNumber(authUser?.bankNumberEncrypted);

    return (
      <main className="auth-layout">
        <SecuritySetupLock
          error={error}
          completedBankNumber={completedBankNumber ?? null}
          continueHref={continueHref}
        />
      </main>
    );
  }

  return (
    <main className="auth-layout">
      <SecuritySetupLock error={error} />
    </main>
  );
}

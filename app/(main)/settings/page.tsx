import { ShopSettings } from "@/components/shop-settings";
import { requireUser } from "@/lib/auth";
import { AUTO_RESTOCK_PLAN_META, getNextRestockAt } from "@/lib/auto-restock";
import { formatCurrency } from "@/lib/money";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export default async function SettingsPage() {
  const user = await requireUser();
  const currencyCode = await getActiveCurrencyCode(user.id);
  const subscription = await prisma.autoRestockSubscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    select: {
      plan: true,
      fullAccessEnabled: true,
      restockIntervalMinutes: true,
      lastRestockAt: true,
      lastChargedAt: true,
      startedAt: true,
      createdAt: true,
    },
  });
  const planOptions = (Object.keys(AUTO_RESTOCK_PLAN_META) as Array<keyof typeof AUTO_RESTOCK_PLAN_META>).map(
    (plan) => ({
      plan,
      name: AUTO_RESTOCK_PLAN_META[plan].name,
      costLabel: formatCurrency(AUTO_RESTOCK_PLAN_META[plan].dailyCostCents, currencyCode),
    }),
  );
  const nextRestockAt = subscription
    ? getNextRestockAt(subscription.plan, subscription)
    : null;

  return (
    <div className="page-grid">
      <section className="page-header">
        <h1>Settings</h1>
      </section>
      <ShopSettings
        currentShopName={user.shop?.name ?? null}
        maskedBankNumber={user.bankNumberLast4 ? `****${user.bankNumberLast4}` : "Not set"}
        renameCostLabel={formatCurrency(5_000, currencyCode)}
        autoRestocker={
          subscription
            ? {
                plan: subscription.plan,
                planName: AUTO_RESTOCK_PLAN_META[subscription.plan].name,
                costLabel: formatCurrency(AUTO_RESTOCK_PLAN_META[subscription.plan].dailyCostCents, currencyCode),
                nextCheckLabel: `Next check ${nextRestockAt?.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                }) ?? "soon"}`,
                fullAccessEnabled: subscription.fullAccessEnabled,
              }
            : null
        }
        planOptions={planOptions}
      />
    </div>
  );
}

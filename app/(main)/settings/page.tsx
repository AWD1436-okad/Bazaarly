import { ShopSettings } from "@/components/shop-settings";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="page-grid">
      <section className="page-header">
        <h1>Settings</h1>
      </section>
      <ShopSettings
        currentShopName={user.shop?.name ?? null}
        maskedBankNumber={user.bankNumberLast4 ? `****${user.bankNumberLast4}` : "Not set"}
      />
    </div>
  );
}

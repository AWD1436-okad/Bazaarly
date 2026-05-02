import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Gauge,
  Info,
  PackageSearch,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Store,
  WalletCards,
  XCircle,
} from "lucide-react";

export const APP_ICONS = {
  alert: AlertTriangle,
  bell: Bell,
  cart: ShoppingCart,
  check: CheckCircle2,
  dashboard: Gauge,
  error: XCircle,
  info: Info,
  orders: ReceiptText,
  search: Search,
  settings: Settings,
  supplier: PackageSearch,
  store: Store,
  wallet: WalletCards,
} satisfies Record<string, LucideIcon>;

type AppIconProps = {
  icon: LucideIcon;
  label?: string;
  tone?: "gradient" | "soft" | "plain";
  size?: "sm" | "md";
};

export function AppIcon({ icon: Icon, label, tone = "soft", size = "sm" }: AppIconProps) {
  return (
    <span
      className={["app-icon", `app-icon--${tone}`, `app-icon--${size}`].join(" ")}
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
    >
      <Icon strokeWidth={2.25} />
    </span>
  );
}

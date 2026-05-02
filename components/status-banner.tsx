import { APP_ICONS, AppIcon } from "@/components/app-icon";

type StatusBannerProps = {
  tone?: "success" | "warning" | "info" | "error";
  title: string;
  body: string;
  action?: React.ReactNode;
};

export function StatusBanner({
  tone = "info",
  title,
  body,
  action,
}: StatusBannerProps) {
  const icon =
    tone === "success"
      ? APP_ICONS.check
      : tone === "warning"
        ? APP_ICONS.alert
        : tone === "error"
          ? APP_ICONS.error
          : APP_ICONS.info;

  return (
    <section className={`status-banner status-banner--${tone}`}>
      <div className="status-banner__content">
        <AppIcon icon={icon} tone={tone === "error" ? "soft" : "gradient"} size="md" />
        <div>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
      </div>
      {action ? <div>{action}</div> : null}
    </section>
  );
}

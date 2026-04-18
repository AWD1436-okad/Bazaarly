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
  return (
    <section className={`status-banner status-banner--${tone}`}>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </section>
  );
}

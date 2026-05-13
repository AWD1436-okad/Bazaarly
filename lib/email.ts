type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export const DEFAULT_EMAIL_FROM =
  process.env.EMAIL_FROM ||
  `${process.env.EMAIL_SENDER_NAME || "Profit Planet"} <${process.env.EMAIL_FROM_ADDRESS || "no-reply@profitplanet.win"}>`;

export function isEmailDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendProfitPlanetEmail({ to, subject, text }: SendEmailInput) {
  if (!isEmailDeliveryConfigured()) {
    return { sent: false, reason: "No email provider configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: DEFAULT_EMAIL_FROM,
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email provider rejected the message${detail ? `: ${detail}` : ""}`);
  }

  return { sent: true };
}

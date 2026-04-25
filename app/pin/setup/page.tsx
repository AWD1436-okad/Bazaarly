import { redirect } from "next/navigation";

export default function LegacyPinSetupPage() {
  redirect("/security-setup" as never);
}

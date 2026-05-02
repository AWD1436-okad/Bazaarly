import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
  }
  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.json({ ok: false, error: "Complete security setup first" }, { status: 403 });
  }

  const formData = await request.formData();
  const enabled = String(formData.get("enabled") ?? "false").toLowerCase() === "true";
  const quantityRaw = Number(formData.get("quantity") ?? "1");
  const quantity = Number.isFinite(quantityRaw) ? Math.trunc(quantityRaw) : 1;

  if (quantity < 1 || quantity > 5) {
    return NextResponse.json({ ok: false, error: "Quantity must be between 1 and 5" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      autoRestockEnabled: enabled,
      autoRestockQuantity: quantity,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/supplier");

  return NextResponse.json({
    ok: true,
    enabled,
    quantity,
    message: enabled
      ? `Auto Restock enabled at quantity ${quantity}`
      : "Auto Restock disabled",
  });
}

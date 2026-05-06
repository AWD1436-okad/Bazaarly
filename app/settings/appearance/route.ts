import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { normalizeAppearancePreset } from "@/lib/appearance";
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
  const appearancePreset = normalizeAppearancePreset(String(formData.get("appearancePreset") ?? ""));

  await prisma.user.update({
    where: { id: user.id },
    data: { appearancePreset },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");

  return NextResponse.json({
    ok: true,
    message: "Appearance preset updated",
    appearancePreset,
  });
}

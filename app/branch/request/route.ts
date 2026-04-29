import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { expireOldBranchRequests, getBranchRequestExpiry, validateSuburbLocation } from "@/lib/branching";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await requireUser();
  const formData = await request.formData();
  const parentShopId = String(formData.get("parentShopId") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 240);
  const locationResult = validateSuburbLocation(String(formData.get("location") ?? ""));

  if (!locationResult.ok) {
    return NextResponse.redirect(
      new URL(`/branch/join?error=${encodeURIComponent(locationResult.error)}`, request.url),
      303,
    );
  }

  await expireOldBranchRequests();

  const parentShop = await prisma.shop.findFirst({
    where: {
      id: parentShopId,
      availableToBranch: true,
      status: "ACTIVE",
      ownerId: { not: user.id },
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  if (!parentShop) {
    return NextResponse.redirect(new URL("/branch/join?error=Shop%20is%20not%20available", request.url), 303);
  }

  await prisma.branchRequest.create({
    data: {
      requesterId: user.id,
      parentShopId: parentShop.id,
      message,
      requestedLocation: locationResult.location,
      expiresAt: getBranchRequestExpiry(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: parentShop.ownerId,
      type: NotificationType.SYSTEM,
      message: `${user.displayName} requested to open a branch of ${parentShop.name}.`,
    },
  });

  revalidatePath("/branch/join");
  revalidatePath("/settings");
  return NextResponse.redirect(new URL("/branch/join?requested=1", request.url), 303);
}

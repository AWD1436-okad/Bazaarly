import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { expireOldBranchRequests, validateSuburbLocation } from "@/lib/branching";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await requireUser();
  const formData = await request.formData();
  const requestId = String(formData.get("requestId") ?? "");
  const locationResult = validateSuburbLocation(String(formData.get("location") ?? ""));

  if (!locationResult.ok) {
    return NextResponse.redirect(
      new URL(`/branch/join?error=${encodeURIComponent(locationResult.error)}`, request.url),
      303,
    );
  }

  if (user.shop) {
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  }

  await expireOldBranchRequests();

  const branchRequest = await prisma.branchRequest.findFirst({
    where: {
      id: requestId,
      requesterId: user.id,
      status: "APPROVED",
      requesterShopId: null,
    },
    include: {
      parentShop: true,
    },
  });

  if (!branchRequest) {
    return NextResponse.redirect(new URL("/branch/join?error=Approved%20request%20not%20found", request.url), 303);
  }

  const baseName = `${branchRequest.parentShop.name} ${locationResult.location} Branch`;
  const baseSlug = slugify(baseName);
  const existingCount = await prisma.shop.count({
    where: {
      slug: {
        startsWith: baseSlug,
      },
    },
  });
  const slug = existingCount > 0 ? `${baseSlug}-${existingCount + 1}` : baseSlug;

  await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        ownerId: user.id,
        name: baseName,
        slug,
        description: `Branch of ${branchRequest.parentShop.name} serving ${locationResult.location}.`,
        categoryFocus: branchRequest.parentShop.categoryFocus,
        accentColor: branchRequest.parentShop.accentColor,
        logoText: branchRequest.parentShop.logoText,
        parentShopId: branchRequest.parentShopId,
        branchLocation: locationResult.location,
      },
    });

    await tx.branchRequest.update({
      where: { id: branchRequest.id },
      data: {
        requesterShopId: shop.id,
        approvedLocation: locationResult.location,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        hasCompletedOnboarding: true,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: `${shop.name} has been created as a branch shop.`,
      },
    });

    await tx.notification.create({
      data: {
        userId: branchRequest.parentShop.ownerId,
        type: NotificationType.SYSTEM,
        message: `${shop.name} is now a branch of ${branchRequest.parentShop.name}.`,
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return NextResponse.redirect(new URL("/dashboard?branchCreated=1", request.url), 303);
}

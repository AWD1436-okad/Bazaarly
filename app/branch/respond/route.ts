import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { expireOldBranchRequests } from "@/lib/branching";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await requireUser();
  const formData = await request.formData();
  const requestId = String(formData.get("requestId") ?? "");
  const action = String(formData.get("action") ?? "");

  await expireOldBranchRequests();

  if (!user.shop) {
    return NextResponse.redirect(new URL("/settings?error=Shop%20required", request.url), 303);
  }

  const branchRequest = await prisma.branchRequest.findFirst({
    where: {
      id: requestId,
      parentShopId: user.shop.id,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: {
      requester: true,
      parentShop: true,
    },
  });

  if (!branchRequest) {
    return NextResponse.redirect(new URL("/settings?error=Branch%20request%20not%20available", request.url), 303);
  }

  const approved = action === "approve";
  const nextStatus = approved ? "APPROVED" : "REJECTED";

  await prisma.$transaction(async (tx) => {
    await tx.branchRequest.update({
      where: { id: branchRequest.id },
      data: {
        status: nextStatus,
        decidedAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId: branchRequest.requesterId,
        type: NotificationType.SYSTEM,
        message: approved
          ? `${branchRequest.parentShop.name} approved your branch request. Finish your branch setup.`
          : `${branchRequest.parentShop.name} rejected your branch request.`,
      },
    });
  });

  revalidatePath("/settings");
  revalidatePath("/branch/join");
  return NextResponse.redirect(new URL(`/settings?branch=${approved ? "approved" : "rejected"}`, request.url), 303);
}

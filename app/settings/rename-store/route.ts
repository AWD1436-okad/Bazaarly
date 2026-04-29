import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser, hasCompletedSecuritySetup } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { verifyPassword } from "@/lib/password";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

const RENAME_COST_CENTS = 20_000;
const MIN_SHOP_NAME_LENGTH = 2;
const MAX_SHOP_NAME_LENGTH = 48;

function readFormString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
  }
  if (!hasCompletedSecuritySetup(user)) {
    return NextResponse.json({ ok: false, error: "Complete security setup first" }, { status: 403 });
  }

  if (!user.shop) {
    return NextResponse.json({ ok: false, error: "Shop setup required" }, { status: 400 });
  }

  const formData = await request.formData();
  const currencyCode = await getActiveCurrencyCode(user.id);
  const newName = readFormString(formData, "name");
  const password = readFormString(formData, "password");
  const baseSlug = slugify(newName);

  if (
    !newName ||
    newName.length < MIN_SHOP_NAME_LENGTH ||
    newName.length > MAX_SHOP_NAME_LENGTH ||
    !baseSlug
  ) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid store name" },
      { status: 400 },
    );
  }

  if (!password || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 403 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const duplicateShop = await tx.shop.findFirst({
        where: {
          id: { not: user.shop!.id },
          name: {
            equals: newName,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (duplicateShop) {
        throw new Error("That store name is already taken");
      }

      const balanceUpdate = await tx.user.updateMany({
        where: {
          id: user.id,
          deletedAt: null,
          balance: { gte: RENAME_COST_CENTS },
        },
        data: {
          balance: {
            decrement: RENAME_COST_CENTS,
          },
        },
      });

      if (balanceUpdate.count !== 1) {
        throw new Error(`You need ${formatCurrency(RENAME_COST_CENTS, currencyCode)} to rename your store`);
      }

      const matchingSlugs = await tx.shop.count({
        where: {
          id: { not: user.shop!.id },
          slug: {
            startsWith: baseSlug,
          },
        },
      });
      const slug = matchingSlugs > 0 ? `${baseSlug}-${matchingSlugs + 1}` : baseSlug;

      await tx.shop.update({
        where: { id: user.shop!.id },
        data: {
          name: newName,
          slug,
          logoText: newName
            .split(" ")
            .slice(0, 2)
            .map((word) => word[0]?.toUpperCase() ?? "")
            .join(""),
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          message: `Store renamed to ${newName}. ${formatCurrency(
            RENAME_COST_CENTS,
            currencyCode,
          )} was charged from your balance.`,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Store rename failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath(`/shop/${user.shop.id}`);

  return NextResponse.json({
    ok: true,
    message: "Store renamed successfully",
  });
}

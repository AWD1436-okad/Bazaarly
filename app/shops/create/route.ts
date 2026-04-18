import { ProductCategory, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

const DEFAULT_STARTING_BALANCE = 22000;
const STARTER_STOCK = [
  { sku: "food-apples", quantity: 8, cost: 110 },
  { sku: "food-bread", quantity: 4, cost: 220 },
  { sku: "drink-water", quantity: 6, cost: 100 },
] as const;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  if (user.shop) {
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryValue = String(formData.get("categoryFocus") ?? "");
  const accentColor = String(formData.get("accentColor") ?? "#2D6A4F");

  if (!name || !description) {
    return NextResponse.redirect(
      new URL("/onboarding/shop?error=Complete%20all%20required%20fields", request.url),
      303,
    );
  }

  const categoryFocus =
    categoryValue && categoryValue in ProductCategory
      ? (categoryValue as ProductCategory)
      : null;

  const baseSlug = slugify(name);
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
        name,
        slug,
        description,
        categoryFocus,
        accentColor,
        logoText: name
          .split(" ")
          .slice(0, 2)
          .map((word) => word[0]?.toUpperCase() ?? "")
          .join(""),
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: DEFAULT_STARTING_BALANCE,
        hasCompletedOnboarding: true,
      },
    });

    for (const starterItem of STARTER_STOCK) {
      const product = await tx.product.findUnique({
        where: { sku: starterItem.sku },
      });

      if (!product) continue;

      await tx.inventory.create({
        data: {
          userId: user.id,
          productId: product.id,
          quantity: starterItem.quantity,
          averageUnitCost: starterItem.cost,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: `Welcome to Bazaarly. ${shop.name} is ready. Start by buying stock from the supplier.`,
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding/shop");
  return NextResponse.redirect(new URL("/dashboard?welcome=1", request.url), 303);
}

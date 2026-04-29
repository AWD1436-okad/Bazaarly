"use server";

import { ProductCategory, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPostLoginRedirect, hasCompletedSecuritySetup, requireUser, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCurrencyInput } from "@/lib/money";
import { getLiveStockStatusMessage, sanitizeStockCount } from "@/lib/stock";
import { clamp, slugify } from "@/lib/utils";

const DEFAULT_STARTING_BALANCE = 22000;
const STARTER_STOCK = [
  { name: "Apples", quantity: 8, cost: 330 },
  { name: "Bread", quantity: 4, cost: 150 },
  { name: "Milk", quantity: 6, cost: 110 },
] as const;

export async function loginAction(formData: FormData) {
  const mode = String(formData.get("mode") ?? "login");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!username) {
    redirect("/login?error=Enter%20a%20username");
  }

  if (mode === "register") {
    if (!email || !displayName) {
      redirect("/login?error=Enter%20a%20display%20name%20and%20email");
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      include: { shop: true },
    });

    const user =
      existing ??
      (await prisma.user.create({
        data: {
          username,
          email,
          displayName,
          balance: 0,
        },
        include: {
          shop: true,
        },
      }));

    await setSession(user.id);
    redirect(getPostLoginRedirect(Boolean(user.shop), hasCompletedSecuritySetup(user)) as never);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }],
    },
    include: { shop: true },
  });

  if (!user) {
    redirect("/login?error=Account%20not%20found");
  }

  await setSession(user.id);
  redirect(getPostLoginRedirect(Boolean(user.shop), hasCompletedSecuritySetup(user)) as never);
}

export async function accountLoginAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shop: true },
  });

  if (!user) {
    redirect("/login?error=Account%20not%20found");
  }

  await setSession(user.id);
  redirect(getPostLoginRedirect(Boolean(user.shop), hasCompletedSecuritySetup(user)) as never);
}

export async function createShopAction(formData: FormData) {
  const user = await requireUser();

  if (user.shop) {
    redirect("/dashboard");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryValue = String(formData.get("categoryFocus") ?? "");
  const accentColor = String(formData.get("accentColor") ?? "#2D6A4F");

  if (!name || !description) {
    redirect("/onboarding/shop?error=Complete%20all%20required%20fields");
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
        where: { name: starterItem.name },
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
        message: `Welcome to Tradex. ${shop.name} is ready. Review your starter stock and publish your first listing.`,
      },
    });
  });

  redirect("/dashboard?welcome=1");
}

export async function buyFromSupplierAction() {
  redirect("/dashboard/supplier");
}

export async function createOrUpdateListingAction(formData: FormData) {
  const user = await requireUser();
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const priceCents = parseCurrencyInput(String(formData.get("price") ?? ""));

  if (!user.shop) {
    redirect("/onboarding/shop");
  }

  if (!Number.isInteger(quantity) || quantity <= 0 || !priceCents || priceCents <= 0) {
    redirect("/dashboard?error=Enter%20a%20valid%20price%20and%20quantity");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
        include: {
          product: true,
        },
      });

      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      const listing = await tx.listing.findUnique({
        where: {
          shopId_productId: {
            shopId: user.shop!.id,
            productId,
          },
        },
      });

      const currentlyAllocated = sanitizeStockCount(
        inventory.allocatedQuantity - (listing?.quantity ?? 0),
      );
      const maxListable = sanitizeStockCount(inventory.quantity - currentlyAllocated);

      if (quantity > maxListable) {
        throw new Error("Listing quantity exceeds available inventory");
      }

      if (listing) {
        await tx.listing.update({
          where: { id: listing.id },
          data: {
            price: priceCents,
            quantity,
            active: quantity > 0,
            isPaused: false,
          },
        });
      } else {
        await tx.listing.create({
          data: {
            shopId: user.shop!.id,
            productId,
            price: priceCents,
            quantity,
            active: true,
            isPaused: false,
          },
        });
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          allocatedQuantity: sanitizeStockCount(currentlyAllocated + quantity),
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          message: `${inventory.product.name} is now live in your shop.`,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Listing update failed";
    redirect(`/dashboard?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  redirect("/dashboard?listingSuccess=1");
}

export async function toggleListingAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "");

  await prisma.listing.updateMany({
    where: {
      id: listingId,
      shop: {
        ownerId: user.id,
      },
    },
    data: {
      active: false,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
}

export async function addToCartAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "");
  const quantity = clamp(Number(formData.get("quantity") ?? 1), 1, 99);

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      shop: true,
      product: true,
    },
  });

  if (!listing || !listing.active || listing.isPaused || listing.quantity < quantity) {
    redirect("/marketplace?error=Listing%20is%20not%20available");
  }

  if (listing.shop.ownerId === user.id) {
    redirect("/marketplace?error=You%20cannot%20buy%20from%20your%20own%20shop");
  }

  const existingCart = await prisma.cart.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
  });

  if (existingCart && existingCart.shopId && existingCart.shopId !== listing.shopId) {
    redirect("/cart?error=Checkout%20is%20single-seller%20for%20this%20version");
  }

  const cart =
    existingCart ??
    (await prisma.cart.create({
      data: {
        userId: user.id,
        shopId: listing.shopId,
      },
    }));

  const cartItem = await prisma.cartItem.findUnique({
    where: {
      cartId_listingId: {
        cartId: cart.id,
        listingId: listing.id,
      },
    },
  });

  const nextQuantity = (cartItem?.quantity ?? 0) + quantity;

  if (nextQuantity > listing.quantity) {
    redirect("/cart?error=Not%20enough%20stock%20for%20that%20quantity");
  }

  if (cartItem) {
    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: {
        quantity: nextQuantity,
        unitPriceSnapshot: listing.price,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        listingId: listing.id,
        productId: listing.productId,
        source: "MARKETPLACE",
        quantity,
        unitPriceSnapshot: listing.price,
      },
    });
  }

  revalidatePath("/cart");
  redirect("/cart?added=1");
}

export async function updateCartItemAction(formData: FormData) {
  const user = await requireUser();
  const cartItemId = String(formData.get("cartItemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
      listing: true,
    },
  });

  if (!cartItem || cartItem.cart.userId !== user.id) {
    redirect("/cart");
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  } else if (cartItem.listing) {
    const safeQuantity = clamp(quantity, 1, cartItem.listing.quantity);
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity: safeQuantity,
        unitPriceSnapshot: cartItem.listing.price,
      },
    });
  } else {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  revalidatePath("/cart");
}

export async function checkoutAction() {
  await requireUser();
  redirect("/checkout" as never);
}

export async function markNotificationsReadAction() {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      read: false,
    },
    data: {
      read: true,
    },
  });

  revalidatePath("/notifications");
  redirect("/notifications");
}

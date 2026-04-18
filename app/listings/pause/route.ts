import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
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
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

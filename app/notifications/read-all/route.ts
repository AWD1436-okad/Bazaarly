import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

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
  return NextResponse.redirect(new URL("/notifications", request.url));
}

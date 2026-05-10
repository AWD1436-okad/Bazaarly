import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { normalizePlayerMode } from "@/lib/player-mode";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "syd1";

export async function POST(request: Request) {
  const user = await requireUser();
  const formData = await request.formData();
  const playerMode = normalizePlayerMode(formData.get("playerMode"));

  await prisma.$executeRaw`
    UPDATE "User"
    SET "playerMode" = ${playerMode}::"PlayerMode",
        "playerModeConfirmed" = true
    WHERE "id" = ${user.id}
  `;

  return NextResponse.json({
    ok: true,
    playerMode,
    message: "Player mode updated",
  });
}

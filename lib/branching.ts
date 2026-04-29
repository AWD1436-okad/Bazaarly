import { addHours } from "date-fns";

import { prisma } from "@/lib/prisma";

export const BRANCH_SETUP_COST_CENTS = 150_000;
export const BRANCH_REQUEST_EXPIRY_HOURS = 48;

const fakeLocationWords = [
  "fake",
  "test",
  "none",
  "nowhere",
  "asdf",
  "qwerty",
  "unknown",
  "location",
  "suburb",
  "abc",
  "123",
];

export function validateSuburbLocation(value: string) {
  const location = value.trim().replace(/\s+/g, " ");
  const lower = location.toLowerCase();

  if (location.length < 3 || location.length > 80) {
    return { ok: false as const, error: "Enter a real suburb or location" };
  }

  if (!/^[a-zA-Z][a-zA-Z\s'.-]+(?:,\s*[a-zA-Z][a-zA-Z\s'.-]+)?$/.test(location)) {
    return { ok: false as const, error: "Location must be a real suburb or place name" };
  }

  if (fakeLocationWords.some((word) => lower.includes(word))) {
    return { ok: false as const, error: "Location looks fake. Enter a real suburb" };
  }

  return { ok: true as const, location };
}

export function getBranchRequestExpiry() {
  return addHours(new Date(), BRANCH_REQUEST_EXPIRY_HOURS);
}

export async function expireOldBranchRequests() {
  await prisma.branchRequest.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: new Date() },
    },
    data: {
      status: "EXPIRED",
    },
  });
}

function levenshtein(left: string, right: string) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

export function fuzzyShopMatchScore(query: string, shopName: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedName = shopName.trim().toLowerCase();

  if (!normalizedQuery) return 1;
  if (normalizedName.includes(normalizedQuery)) return 100;

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const nameTokens = normalizedName.split(/\s+/).filter(Boolean);

  let score = 0;
  for (const queryToken of queryTokens) {
    for (const nameToken of nameTokens) {
      const distance = levenshtein(queryToken, nameToken);
      const allowedDistance = queryToken.length <= 5 ? 2 : 3;
      if (distance <= allowedDistance) {
        score += 45 - distance * 8;
      }
    }
  }

  return score;
}

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { hashPassword, verifyPassword } from "@/lib/password";

const PIN_PATTERN = /^\d{4,8}$/;
const BANK_NUMBER_PATTERN = /^\d{6,12}$/;

function getPinPepper() {
  return process.env.CHECKOUT_PIN_PEPPER ?? process.env.SESSION_COOKIE_NAME ?? "tradex-pin";
}

function getBankEncryptionKey() {
  return createHash("sha256")
    .update(process.env.BANK_NUMBER_ENCRYPTION_KEY ?? getPinPepper())
    .digest();
}

export function validateCheckoutPin(pin: string) {
  const normalizedPin = pin.trim();

  if (!PIN_PATTERN.test(normalizedPin)) {
    return {
      success: false as const,
      error: "Use a 4-8 digit PIN",
    };
  }

  return {
    success: true as const,
    pin: normalizedPin,
  };
}

export function validateBankNumber(bankNumber: string) {
  const normalizedBankNumber = bankNumber.trim();

  if (!BANK_NUMBER_PATTERN.test(normalizedBankNumber)) {
    return {
      success: false as const,
      error: "Use a 6-12 digit bank number",
    };
  }

  return {
    success: true as const,
    bankNumber: normalizedBankNumber,
  };
}

export function hashCheckoutPin(pin: string) {
  return hashPassword(pin);
}

export function verifyCheckoutPin(pin: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  return verifyPassword(pin, storedHash);
}

export function hashBankNumber(bankNumber: string) {
  return hashPassword(bankNumber);
}

export function verifyBankNumber(bankNumber: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  return verifyPassword(bankNumber, storedHash);
}

export function getCheckoutPinLookupHash(pin: string) {
  return createHash("sha256").update(`${getPinPepper()}:${pin}`).digest("hex");
}

export function getBankNumberLookupHash(bankNumber: string) {
  return createHash("sha256").update(`${getPinPepper()}:bank:${bankNumber}`).digest("hex");
}

export function encryptBankNumber(bankNumber: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getBankEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(bankNumber, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptBankNumber(encryptedBankNumber: string | null | undefined) {
  if (!encryptedBankNumber) {
    return null;
  }

  const [ivHex, tagHex, encryptedHex] = encryptedBankNumber.split(":");
  if (!ivHex || !tagHex || !encryptedHex) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getBankEncryptionKey(),
      Buffer.from(ivHex, "hex"),
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, "hex")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function maskBankNumber(bankNumber: string | null | undefined) {
  if (!bankNumber) {
    return "Not recoverable";
  }

  return `****${bankNumber.slice(-4)}`;
}

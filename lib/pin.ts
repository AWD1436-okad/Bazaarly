import { createHash } from "node:crypto";

import { hashPassword, verifyPassword } from "@/lib/password";

const PIN_PATTERN = /^\d{4,8}$/;
const BANK_NUMBER_PATTERN = /^\d{6,12}$/;

function getPinPepper() {
  return process.env.CHECKOUT_PIN_PEPPER ?? process.env.SESSION_COOKIE_NAME ?? "bazaarly-pin";
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

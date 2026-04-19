import { z } from "zod";

const MAX_FORM_QUANTITY = 999;
const MAX_PRICE_CENTS = 1_000_000;

function getFormStringValue(formValue: FormDataEntryValue | null | undefined) {
  return typeof formValue === "string" ? formValue.trim() : "";
}

const routeIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+$/i);

const positiveQuantitySchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value) && value > 0 && value <= MAX_FORM_QUANTITY);

const nonNegativeQuantitySchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value) && value >= 0 && value <= MAX_FORM_QUANTITY);

const priceInputSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/)
  .transform((value) => Math.round(Number(value) * 100))
  .refine(
    (value) => Number.isSafeInteger(value) && value > 0 && value <= MAX_PRICE_CENTS,
  );

export function parseRouteId(formData: FormData, fieldName: string) {
  return routeIdSchema.safeParse(getFormStringValue(formData.get(fieldName)));
}

export function parsePositiveQuantity(formData: FormData, fieldName: string) {
  return positiveQuantitySchema.safeParse(getFormStringValue(formData.get(fieldName)));
}

export function parseNonNegativeQuantity(formData: FormData, fieldName: string) {
  return nonNegativeQuantitySchema.safeParse(getFormStringValue(formData.get(fieldName)));
}

export function parsePriceInput(formData: FormData, fieldName: string) {
  return priceInputSchema.safeParse(getFormStringValue(formData.get(fieldName)));
}

export function isSafePositiveQuantity(value: number, max = Number.MAX_SAFE_INTEGER) {
  return Number.isSafeInteger(value) && value > 0 && value <= max;
}

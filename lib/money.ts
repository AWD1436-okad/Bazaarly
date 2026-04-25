import { getPriceProfileMetadata, normalizeCurrencyCode } from "@/lib/price-profiles";

export function formatCurrency(cents: number, currencyCodeInput = "AUD") {
  const currencyCode = normalizeCurrencyCode(currencyCodeInput);
  const profile = getPriceProfileMetadata(currencyCode);

  return new Intl.NumberFormat(profile.locale, {
    style: "currency",
    currency: profile.currencyCode,
    minimumFractionDigits: profile.fractionDigits,
    maximumFractionDigits: profile.fractionDigits,
  }).format(cents / 100);
}

export function formatPriceWithUnit(cents: number, unitLabel: string, currencyCode = "AUD") {
  return `${formatCurrency(cents, currencyCode)} ${unitLabel}`;
}

export function parseCurrencyInput(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.round(numeric * 100);
}

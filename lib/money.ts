import { getPriceProfileMetadata, normalizeCurrencyCode } from "@/lib/price-profiles";

export const AUD_EXCHANGE_RATES: Record<string, number> = {
  AUD: 1,
  USD: 0.713,
  GBP: 0.53,
  EUR: 0.61,
  PKR: 193,
  INR: 67.1,
  AED: 2.62,
  SAR: 2.67,
  TRY: 23.2,
};

export function convertAudCentsToCurrencyMinorUnits(audCents: number, currencyCodeInput = "AUD") {
  const currencyCode = normalizeCurrencyCode(currencyCodeInput);
  const profile = getPriceProfileMetadata(currencyCode);
  const audMajor = audCents / 100;
  const convertedMajor = audMajor * (AUD_EXCHANGE_RATES[currencyCode] ?? 1);

  return Math.round(convertedMajor * 10 ** profile.fractionDigits);
}

export function convertCurrencyInputToAudCents(value: string, currencyCodeInput = "AUD") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const currencyCode = normalizeCurrencyCode(currencyCodeInput);
  const rate = AUD_EXCHANGE_RATES[currencyCode] ?? 1;
  return Math.round((numeric / rate) * 100);
}

export function formatMoney(baseAudCents: number, currencyCodeInput = "AUD") {
  const currencyCode = normalizeCurrencyCode(currencyCodeInput);
  const profile = getPriceProfileMetadata(currencyCode);
  const convertedMinorUnits = convertAudCentsToCurrencyMinorUnits(baseAudCents, currencyCode);
  const convertedMajor = convertedMinorUnits / 10 ** profile.fractionDigits;

  if (currencyCode === "PKR") {
    return `Rs ${new Intl.NumberFormat("en-PK", {
      maximumFractionDigits: 0,
    }).format(convertedMajor)}`;
  }

  return new Intl.NumberFormat(profile.locale, {
    style: "currency",
    currency: profile.currencyCode,
    minimumFractionDigits: profile.fractionDigits,
    maximumFractionDigits: profile.fractionDigits,
  }).format(convertedMajor);
}

export function formatCurrency(cents: number, currencyCodeInput = "AUD") {
  return formatMoney(cents, currencyCodeInput);
}

export function formatPriceWithUnit(cents: number, unitLabel: string, currencyCode = "AUD") {
  return `${formatMoney(cents, currencyCode)} ${unitLabel}`;
}

export function parseCurrencyInput(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.round(numeric * 100);
}

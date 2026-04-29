import { CURRENCY_DATA } from "@/lib/currencies";
import { getPriceProfileMetadata, normalizeCurrencyCode } from "@/lib/price-profiles";

const approximateRatesPerAud: Record<string, number> = {
  AED: 2.39,
  AFN: 45,
  ALL: 55,
  AMD: 252,
  ANG: 1.17,
  AOA: 590,
  ARS: 750,
  AUD: 1,
  AWG: 1.17,
  AZN: 1.1,
  BAM: 1.11,
  BBD: 1.3,
  BDT: 78,
  BGN: 1.11,
  BHD: 0.244,
  BIF: 1900,
  BMD: 0.65,
  BND: 0.87,
  BOB: 4.5,
  BRL: 3.6,
  BSD: 0.65,
  BTN: 56,
  BWP: 9,
  BYN: 2.1,
  BZD: 1.31,
  CAD: 0.89,
  CDF: 1850,
  CHF: 0.58,
  CLP: 620,
  CNY: 4.72,
  COP: 2600,
  CRC: 330,
  CUP: 15.6,
  CVE: 63,
  CZK: 14.3,
  DJF: 115,
  DKK: 4.25,
  DOP: 38,
  DZD: 87,
  EGP: 32,
  ERN: 9.75,
  ETB: 83,
  EUR: 0.57,
  FJD: 1.47,
  FKP: 0.49,
  GBP: 0.49,
  GEL: 1.77,
  GHS: 9.7,
  GIP: 0.49,
  GMD: 47,
  GNF: 5600,
  GTQ: 5,
  GYD: 136,
  HKD: 5.06,
  HNL: 17,
  HRK: 4.3,
  HTG: 85,
  HUF: 225,
  IDR: 11100,
  ILS: 2.4,
  INR: 56,
  IQD: 850,
  IRR: 27300,
  ISK: 83,
  JMD: 105,
  JOD: 0.46,
  JPY: 100,
  KES: 84,
  KGS: 57,
  KHR: 2650,
  KMF: 280,
  KPW: 585,
  KRW: 940,
  KWD: 0.2,
  KYD: 0.54,
  KZT: 335,
  LAK: 14000,
  LBP: 58000,
  LKR: 190,
  LRD: 130,
  LSL: 11.7,
  LYD: 3.1,
  MAD: 6.4,
  MDL: 11.4,
  MGA: 2900,
  MKD: 35,
  MMK: 1360,
  MNT: 2300,
  MOP: 5.2,
  MRU: 26,
  MUR: 30,
  MVR: 10,
  MWK: 1120,
  MXN: 12,
  MYR: 3,
  MZN: 42,
  NAD: 11.7,
  NGN: 950,
  NIO: 24,
  NOK: 6.6,
  NPR: 90,
  NZD: 1.08,
  OMR: 0.25,
  PAB: 0.65,
  PEN: 2.4,
  PGK: 2.6,
  PHP: 37,
  PKR: 181,
  PLN: 2.4,
  PYG: 4800,
  QAR: 2.37,
  RON: 2.85,
  RSD: 67,
  RUB: 60,
  RWF: 930,
  SAR: 2.44,
  SBD: 5.5,
  SCR: 9.5,
  SDG: 390,
  SEK: 6.2,
  SGD: 0.87,
  SHP: 0.49,
  SLE: 14.5,
  SOS: 370,
  SRD: 24,
  SSP: 2100,
  STN: 14,
  SYP: 9400,
  SZL: 11.7,
  THB: 21.5,
  TJS: 7.1,
  TMT: 2.28,
  TND: 1.95,
  TOP: 1.54,
  TRY: 21,
  TTD: 4.4,
  TWD: 20.8,
  TZS: 1700,
  UAH: 27,
  UGX: 2400,
  USD: 0.65,
  UYU: 26,
  UZS: 8300,
  VES: 60,
  VND: 16500,
  VUV: 78,
  WST: 1.78,
  XAF: 373,
  XCD: 1.76,
  XOF: 373,
  XPF: 68,
  YER: 162,
  ZAR: 11.7,
  ZMW: 16,
  ZWL: 235,
};

export const AUD_EXCHANGE_RATES: Record<string, number> = Object.fromEntries(
  CURRENCY_DATA.map((currency) => [currency.code, approximateRatesPerAud[currency.code] ?? 1]),
);

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
  const formattedNumber = new Intl.NumberFormat(profile.locale, {
    minimumFractionDigits: profile.fractionDigits,
    maximumFractionDigits: profile.fractionDigits,
  }).format(convertedMajor);

  return `${profile.symbol} ${formattedNumber}`;
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

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function formatPriceWithUnit(cents: number, unitLabel: string) {
  return `${formatCurrency(cents)} ${unitLabel}`;
}

export function parseCurrencyInput(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.round(numeric * 100);
}

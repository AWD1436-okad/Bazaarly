type CurrencyDisplayNoteProps = {
  currencyCode: string;
  className?: string;
  full?: boolean;
};

export function CurrencyDisplayNote({ currencyCode, className, full = false }: CurrencyDisplayNoteProps) {
  if (full) {
    return (
      <p className={className ?? "muted"}>
        Prices are shown in {currencyCode}. Base values stay in AUD.
      </p>
    );
  }

  return <span className={className ?? "currency-chip"}>Prices shown in {currencyCode}</span>;
}


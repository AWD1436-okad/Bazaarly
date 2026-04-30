import { getCurrencyDisplayNotice } from "@/lib/money";

type CurrencyDisplayNoteProps = {
  currencyCode: string;
  className?: string;
};

export function CurrencyDisplayNote({ currencyCode, className }: CurrencyDisplayNoteProps) {
  return <p className={className ?? "muted"}>{getCurrencyDisplayNotice(currencyCode)}</p>;
}


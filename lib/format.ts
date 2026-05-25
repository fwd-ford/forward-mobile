// Formatadores compartilhados entre telas.
// formatBRL: valor monetario em pt-BR.
//   - { compact: true }: troca valores >= R$ 1.000 por sufixo k
//     (ex.: R$ 12k).
//   - { omitCurrency: true } (combinado com compact): omite o prefixo
//     "R$ " — usado em telas com tipografia editorial onde o R$ tira
//     o ar do numero (ex.: home hero "2742k").

type FormatBRLOptions = {
  compact?: boolean;
  omitCurrency?: boolean;
};

const BRL_FULL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const NUMBER_PT_BR = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

export function formatBRL(value: number, options: FormatBRLOptions = {}): string {
  if (options.compact && value >= 1000) {
    const k = value / 1000;
    const formatted = k.toFixed(k >= 10 ? 0 : 1);
    return options.omitCurrency ? `${formatted}k` : `R$ ${formatted}k`;
  }
  if (options.omitCurrency) {
    return NUMBER_PT_BR.format(value);
  }
  return BRL_FULL.format(value);
}

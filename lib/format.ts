// Formatadores compartilhados entre telas.
// formatBRL: valor monetario em pt-BR. Quando { compact: true }, troca
// valores >= R$ 1.000 por sufixo k (ex.: R$ 12k). A versao completa usa
// Intl.NumberFormat sem fracao.

type FormatBRLOptions = {
  compact?: boolean;
};

const BRL_FULL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatBRL(value: number, options: FormatBRLOptions = {}): string {
  if (options.compact && value >= 1000) {
    const k = value / 1000;
    return `R$ ${k.toFixed(k >= 10 ? 0 : 1)}k`;
  }
  return BRL_FULL.format(value);
}

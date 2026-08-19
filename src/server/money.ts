export function computeLineTotalKurus(
  quantity: number,
  unitPriceKurus: number,
): number {
  return Math.round(quantity * unitPriceKurus);
}

export function computeQuoteTotalKurus(
  items: { quantity: number; unitPriceKurus: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + computeLineTotalKurus(item.quantity, item.unitPriceKurus),
    0,
  );
}

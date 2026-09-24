export function fmtMoney(v) {
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
export function fmtPrice(v) { return '$' + v.toFixed(2); }
export function fmtQty(v) { return v.toFixed(1); }

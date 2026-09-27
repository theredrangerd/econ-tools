export function fmtMoney(v) {
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
export function fmtPrice(v) { return '$' + v.toFixed(2); }
export function fmtQty(v) { return v.toFixed(1); }

export function setStatusPill(pill, text, mode) {
  pill.textContent = text;
  pill.className = 'status-pill' + (mode ? ' ' + mode : '');
}

export function elasticityLabel(slope) {
  if (slope < 0.5) return 'very elastic';
  if (slope < 0.85) return 'elastic';
  if (slope <= 1.15) return 'unit elastic';
  if (slope < 2) return 'inelastic';
  return 'very inelastic';
}

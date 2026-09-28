export function fmtMoney(v) {
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
export function fmtPrice(v) { return '$' + v.toFixed(2); }
export function fmtQty(v) { return v.toFixed(1); }

export function setStatusPill(pill, text, mode) {
  pill.textContent = text;
  pill.className = 'status-pill' + (mode ? ' ' + mode : '');
}

// Takes a real point elasticity (absolute value), never a slope — see pointElasticities()
// in marketEngine.js. "Unit elastic" only when it rounds to exactly 1.00 as displayed.
export function elasticityLabel(e) {
  if (e == null) return '—';
  const shown = e.toFixed(2);
  if (shown === '1.00') return '1.00 · unit elastic';
  return shown + (e > 1 ? ' · elastic' : ' · inelastic');
}

export function fmtShift(v) {
  if (v > 0) return '+' + v;
  if (v < 0) return '−' + Math.abs(v);
  return '0';
}

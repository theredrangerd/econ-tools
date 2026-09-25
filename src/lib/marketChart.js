import { QMAX, PMAX } from './marketEngine.js';

const M = { left: 64, right: 24, top: 24, bottom: 56 };
const VBW = 780, VBH = 520;
const plotW = VBW - M.left - M.right;
const plotH = VBH - M.top - M.bottom;

function clampN(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function sx(q) { return M.left + (q / QMAX) * plotW; }
function sy(p) { return M.top + plotH - (clampN(p, -20, PMAX + 40) / PMAX) * plotH; }

const svgns = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, className) {
  const e = document.createElementNS(svgns, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (className) e.setAttribute('class', className);
  return e;
}
function pts(arr) { return arr.map(([q, p]) => `${sx(q)},${sy(p)}`).join(' '); }

function clipDemand(Dmax, slopeD) {
  const qAtPmax = (Dmax - PMAX) / slopeD, qAtP0 = Dmax / slopeD;
  const q0 = clampN(qAtPmax, 0, QMAX), q1 = clampN(qAtP0, 0, QMAX);
  return [[q0, Dmax - slopeD * q0], [q1, Dmax - slopeD * q1]];
}
function clipSupply(Smin, slopeS) {
  const qAtP0 = -Smin / slopeS, qAtPmax = (PMAX - Smin) / slopeS;
  const q0 = clampN(qAtP0, 0, QMAX), q1 = clampN(qAtPmax, 0, QMAX);
  return [[q0, Smin + slopeS * q0], [q1, Smin + slopeS * q1]];
}

function drawGridAndAxes(svg) {
  const defs = el('defs');
  const pattern = el('pattern', { id: 'dwlHatch', width: 6, height: 6, patternTransform: 'rotate(45)', patternUnits: 'userSpaceOnUse' });
  pattern.appendChild(el('rect', { width: 6, height: 6, fill: 'var(--dwl-fill)' }));
  pattern.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: 'var(--dwl-hatch)', 'stroke-width': 1.4 }));
  defs.appendChild(pattern);
  svg.appendChild(defs);

  svg.appendChild(el('rect', { x: M.left, y: M.top, width: plotW, height: plotH, fill: 'var(--surface)', stroke: 'none' }));

  const g = el('g');
  for (let qq = 0; qq <= QMAX; qq += 20) {
    g.appendChild(el('line', { x1: sx(qq), y1: M.top, x2: sx(qq), y2: M.top + plotH, stroke: 'var(--hairline)', 'stroke-width': 1 }));
    const lbl = el('text', { x: sx(qq), y: M.top + plotH + 20, 'text-anchor': 'middle' }, 'tick-label');
    lbl.textContent = qq;
    g.appendChild(lbl);
  }
  for (let pp = 0; pp <= PMAX; pp += 20) {
    g.appendChild(el('line', { x1: M.left, y1: sy(pp), x2: M.left + plotW, y2: sy(pp), stroke: 'var(--hairline)', 'stroke-width': 1 }));
    const plbl = el('text', { x: M.left - 10, y: sy(pp) + 4, 'text-anchor': 'end' }, 'tick-label');
    plbl.textContent = pp;
    g.appendChild(plbl);
  }
  svg.appendChild(g);

  svg.appendChild(el('line', { x1: M.left, y1: M.top, x2: M.left, y2: M.top + plotH, stroke: 'var(--hairline-2)', 'stroke-width': 1.5 }));
  svg.appendChild(el('line', { x1: M.left, y1: M.top + plotH, x2: M.left + plotW, y2: M.top + plotH, stroke: 'var(--hairline-2)', 'stroke-width': 1.5 }));

  const xl = el('text', { x: M.left + plotW / 2, y: VBH - 10, 'text-anchor': 'middle' }, 'axis-label');
  xl.textContent = 'Quantity (units)';
  svg.appendChild(xl);
  const yl = el('text', { x: 16, y: M.top + plotH / 2, 'text-anchor': 'middle', transform: `rotate(-90 16 ${M.top + plotH / 2})` }, 'axis-label');
  yl.textContent = 'Price ($ / unit)';
  svg.appendChild(yl);
}

const MODE_LABELS = {
  ceiling: 'Price ceiling',
  floor: 'Price floor',
};

function drawWedgeLines(svg, result) {
  if (result.mode === 'ceiling' || result.mode === 'floor') {
    const y = sy(result.Pc);
    svg.appendChild(el('line', { x1: M.left, y1: y, x2: M.left + plotW, y2: y, stroke: 'var(--dwl-line)', 'stroke-width': 1.6, 'stroke-dasharray': '6,3' }, 'wedge-line'));
    const lbl = el('text', { x: M.left + plotW - 6, y: y - 6, 'text-anchor': 'end', fill: 'var(--dwl-line)' }, 'tick-label');
    lbl.textContent = MODE_LABELS[result.mode];
    svg.appendChild(lbl);
  } else if (result.mode === 'tax' || result.mode === 'subsidy') {
    svg.appendChild(el('polygon', { points: pts(result.wedgePoly), fill: 'var(--gov-fill)' }, 'wedge-fill'));
    const yc = sy(result.Pc), yp = sy(result.Pp);
    svg.appendChild(el('line', { x1: M.left, y1: yc, x2: M.left + plotW, y2: yc, stroke: 'var(--demand)', 'stroke-width': 1.6, 'stroke-dasharray': '6,3' }, 'wedge-line'));
    svg.appendChild(el('line', { x1: M.left, y1: yp, x2: M.left + plotW, y2: yp, stroke: 'var(--supply)', 'stroke-width': 1.6, 'stroke-dasharray': '6,3' }, 'wedge-line'));
    const cLbl = el('text', { x: M.left + plotW - 6, y: yc - 6, 'text-anchor': 'end', fill: 'var(--demand)' }, 'tick-label');
    cLbl.textContent = 'Price consumers pay';
    svg.appendChild(cLbl);
    const pLbl = el('text', { x: M.left + plotW - 6, y: yp + 14, 'text-anchor': 'end', fill: 'var(--supply)' }, 'tick-label');
    pLbl.textContent = 'Price producers receive';
    svg.appendChild(pLbl);
  } else if (result.requestedControl) {
    const { type, price } = result.requestedControl;
    const y = sy(price);
    svg.appendChild(el('line', { x1: M.left, y1: y, x2: M.left + plotW, y2: y, stroke: 'var(--ink-muted)', 'stroke-width': 1.4, 'stroke-dasharray': '4,4' }, 'wedge-line'));
    const lbl = el('text', { x: M.left + plotW - 6, y: y - 6, 'text-anchor': 'end', fill: 'var(--ink-muted)' }, 'tick-label');
    lbl.textContent = (type === 'floor' ? 'Price floor' : 'Price ceiling') + ' (not binding)';
    svg.appendChild(lbl);
  }
}

export function renderMarketChart(svg, result) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.setAttribute('viewBox', `0 0 ${VBW} ${VBH}`);

  drawGridAndAxes(svg);

  if (!result.noTrade) {
    svg.appendChild(el('polygon', { points: pts(result.csPoly), fill: 'var(--demand-fill)' }, 'cs-fill'));
    svg.appendChild(el('polygon', { points: pts(result.psPoly), fill: 'var(--supply-fill)' }, 'ps-fill'));
    if (result.dwlPoly) {
      svg.appendChild(el('polygon', { points: pts(result.dwlPoly), fill: 'url(#dwlHatch)' }, 'dwl-fill'));
      svg.appendChild(el('polygon', { points: pts(result.dwlPoly), fill: 'none', stroke: 'var(--dwl-line)', 'stroke-width': 1.3, 'stroke-dasharray': '3,2' }, 'dwl-outline'));
    }
  }

  const dSeg = clipDemand(result.Dmax, result.slopeD), sSeg = clipSupply(result.Smin, result.slopeS);
  svg.appendChild(el('line', { x1: sx(dSeg[0][0]), y1: sy(dSeg[0][1]), x2: sx(dSeg[1][0]), y2: sy(dSeg[1][1]), stroke: 'var(--demand)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, 'demand-curve'));
  svg.appendChild(el('line', { x1: sx(sSeg[0][0]), y1: sy(sSeg[0][1]), x2: sx(sSeg[1][0]), y2: sy(sSeg[1][1]), stroke: 'var(--supply)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, 'supply-curve'));

  const dLbl = el('text', { x: sx(dSeg[0][0]) + 8, y: sy(dSeg[0][1]) - 6, fill: 'var(--demand)' }, 'curve-label');
  dLbl.textContent = 'Demand';
  svg.appendChild(dLbl);
  const sLbl = el('text', { x: sx(sSeg[1][0]) - 8, y: sy(sSeg[1][1]) - 8, fill: 'var(--supply)', 'text-anchor': 'end' }, 'curve-label');
  sLbl.textContent = 'Supply';
  svg.appendChild(sLbl);

  if (!result.noTrade) {
    svg.appendChild(el('line', { x1: sx(result.Qstar), y1: sy(result.Pstar), x2: sx(result.Qstar), y2: M.top + plotH, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '3,3' }));
    svg.appendChild(el('line', { x1: M.left, y1: sy(result.Pstar), x2: sx(result.Qstar), y2: sy(result.Pstar), stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '3,3' }));
    svg.appendChild(el('circle', { cx: sx(result.Qstar), cy: sy(result.Pstar), r: 4.5, fill: 'var(--ink)' }));

    drawWedgeLines(svg, result);

    if (result.mode !== 'free') {
      svg.appendChild(el('line', { x1: sx(result.Q), y1: sy(result.Pc), x2: sx(result.Q), y2: M.top + plotH, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '1,3' }));
      svg.appendChild(el('circle', { cx: sx(result.Q), cy: sy(result.Pc), r: 4, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 1.8 }));
    }
  }
}

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

// Renders e.g. "S" + subscript "1" as a real SVG subscript, not a unicode digit
// (keeps curve labels short and unambiguous once a second supply line is on screen).
function subscriptLabel(base, sub, attrs, className = 'curve-label') {
  const t = el('text', attrs, className);
  t.textContent = base;
  const tspan = el('tspan', { 'baseline-shift': 'sub', 'font-size': '0.75em' });
  tspan.textContent = sub;
  t.appendChild(tspan);
  return t;
}

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

// After a specific tax or subsidy, supply shifts by a constant amount (parallel line);
// after an ad valorem tax, it shifts by a constant multiple (the line pivots at the price axis).
function shiftedSupplyParams(result) {
  const { Smin, slopeS, Pc, Pp } = result;
  // Pc/Pp only feed the specific-tax/subsidy branches — the ad valorem pivot comes from
  // taxRate directly, since Pc / Pp divides by zero whenever the producer price hits $0.
  if (result.mode === 'tax') {
    if (result.interventionMode === 'advalorem') {
      const k = 1 + result.taxRate;
      return { Smin: Smin * k, slopeS: slopeS * k };
    }
    const wedge = Pc - Pp;
    return { Smin: Smin + wedge, slopeS };
  }
  if (result.mode === 'subsidy') {
    const wedge = Pp - Pc;
    return { Smin: Smin - wedge, slopeS };
  }
  return null;
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
    const lbl = el('text', { x: sx(qq), y: M.top + plotH + 20, 'text-anchor': 'middle', 'data-axis': 'x', 'data-pos': sx(qq) }, 'tick-label');
    lbl.textContent = qq;
    g.appendChild(lbl);
  }
  for (let pp = 0; pp <= PMAX; pp += 20) {
    g.appendChild(el('line', { x1: M.left, y1: sy(pp), x2: M.left + plotW, y2: sy(pp), stroke: 'var(--hairline)', 'stroke-width': 1 }));
    const plbl = el('text', { x: M.left - 10, y: sy(pp) + 4, 'text-anchor': 'end', 'data-axis': 'y', 'data-pos': sy(pp) }, 'tick-label');
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

// Minimum spacing between axis symbols (and between a symbol and a numeric tick) before
// they're pushed apart / the tick is hidden. y is one text line; x fits "Qd" next to "Qe".
const Y_GAP = 13;
const X_GAP = 24;

// The IB-style symbols a result puts on each axis: Pe/Qe for the free-market equilibrium
// (always, so the before/after comparison stays readable), plus whatever prices and
// quantities the intervention creates.
function axisSymbols(result) {
  const y = [{ base: 'P', sub: 'e', v: result.Pstar }];
  const x = [{ base: 'Q', sub: 'e', v: result.Qstar }];
  if (result.mode === 'ceiling' || result.mode === 'floor') {
    y.push({ base: 'P', sub: result.mode === 'ceiling' ? 'max' : 'min', v: result.Pc });
    x.push({ base: 'Q', sub: 's', v: result.qs }, { base: 'Q', sub: 'd', v: result.qd });
  } else if ((result.mode === 'tax' && !result.closed) || result.mode === 'subsidy') {
    y.push({ base: 'P', sub: 'c', v: result.Pc }, { base: 'P', sub: 'p', v: result.Pp });
    x.push({ base: 'Q', sub: '1', v: result.Q });
  }
  return {
    y: y.map((s) => ({ ...s, pos: sy(s.v) })),
    x: x.filter((s) => s.v >= 0 && s.v <= QMAX).map((s) => ({ ...s, pos: sx(s.v) })),
  };
}

// Pushes 1-D label positions apart to at least `gap`, keeping them in [lo, hi].
function spread(items, gap, lo, hi) {
  items.sort((a, b) => a.pos - b.pos);
  for (let i = 1; i < items.length; i++) {
    if (items[i].pos - items[i - 1].pos < gap) items[i].pos = items[i - 1].pos + gap;
  }
  const over = items.length ? items[items.length - 1].pos - hi : 0;
  if (over > 0) items.forEach((it) => { it.pos -= over; });
  items.forEach((it) => { it.pos = Math.max(lo, it.pos); });
}

function drawAxisSymbols(svg, layer, result) {
  const { x, y } = axisSymbols(result);
  spread(y, Y_GAP, M.top, M.top + plotH);
  spread(x, X_GAP, M.left, M.left + plotW);
  for (const s of y) {
    layer.appendChild(subscriptLabel(s.base, s.sub, { x: M.left - 10, y: s.pos + 4, 'text-anchor': 'end' }, 'axis-symbol'));
  }
  for (const s of x) {
    layer.appendChild(subscriptLabel(s.base, s.sub, { x: s.pos, y: M.top + plotH + 20, 'text-anchor': 'middle' }, 'axis-symbol'));
  }
  // Hide any numeric tick that a symbol now sits on top of.
  svg.querySelectorAll('.tick-label[data-axis]').forEach((tick) => {
    const syms = tick.dataset.axis === 'x' ? x : y;
    const gap = tick.dataset.axis === 'x' ? X_GAP : Y_GAP;
    const hidden = syms.some((s) => Math.abs(s.pos - +tick.dataset.pos) < gap);
    tick.setAttribute('visibility', hidden ? 'hidden' : 'visible');
  });
}

// The shortage (ceiling) or excess supply (floor): a bracket along the control price from
// the smaller of Qs/Qd to the larger, labelled, on the side of the line where there's
// empty space (below a ceiling, above a floor). Clipped with an arrow at the chart edge
// when Qd/Qs lies past it — the note still reports the full amount.
function drawGapBracket(layer, result) {
  const isCeiling = result.mode === 'ceiling';
  const q0 = Math.min(result.qd, result.qs), q1 = Math.max(result.qd, result.qs);
  const x0 = sx(q0), x1 = sx(Math.min(q1, QMAX));
  if (x1 - x0 < 2) return;
  const clipped = q1 > QMAX;
  const yLine = sy(result.Pc);
  const y = isCeiling ? yLine + 12 : yLine - 12;
  const g = el('g', { 'data-region': isCeiling ? 'shortage' : 'excess-supply' }, 'region region--line');
  g.appendChild(el('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: 'transparent', 'stroke-width': 16 }, 'region-hit'));
  const stroke = { stroke: 'var(--ink)', 'stroke-width': 1.4 };
  g.appendChild(el('line', { x1: x0, y1: y, x2: x1, y2: y, ...stroke }, 'gap-bracket region-visible'));
  g.appendChild(el('line', { x1: x0, y1: y - 4, x2: x0, y2: y + 4, ...stroke }, 'region-visible'));
  if (clipped) {
    g.appendChild(el('polyline', { points: `${x1 - 6},${y - 4} ${x1},${y} ${x1 - 6},${y + 4}`, fill: 'none', ...stroke }, 'region-visible'));
  } else {
    g.appendChild(el('line', { x1: x1, y1: y - 4, x2: x1, y2: y + 4, ...stroke }, 'region-visible'));
  }
  const lbl = el('text', { x: (x0 + x1) / 2, y: isCeiling ? y + 15 : y - 7, 'text-anchor': 'middle', fill: 'var(--ink)' }, 'bracket-label');
  lbl.textContent = isCeiling ? 'Shortage' : 'Excess supply';
  g.appendChild(lbl);
  layer.appendChild(g);
}

function drawWedgeLines(svg, result) {
  if (result.mode === 'ceiling' || result.mode === 'floor') {
    const y = sy(result.Pc);
    // Grouped under data-region so regionExplainers.js can hover/click it as a unit; the
    // wide transparent line gives the thin dashed line a comfortably large hit target.
    const g = el('g', { 'data-region': result.mode }, 'region region--line');
    g.appendChild(el('line', { x1: M.left, y1: y, x2: M.left + plotW, y2: y, stroke: 'transparent', 'stroke-width': 18 }, 'region-hit'));
    g.appendChild(el('line', { x1: M.left, y1: y, x2: M.left + plotW, y2: y, stroke: 'var(--dwl-line)', 'stroke-width': 1.6, 'stroke-dasharray': '6,3' }, 'wedge-line region-visible'));
    // Name label on the opposite side of the line from the gap bracket, so the two can't
    // collide when Qd/Qs reaches the right edge.
    const lbl = el('text', { x: M.left + plotW - 6, y: result.mode === 'ceiling' ? y - 6 : y + 14, 'text-anchor': 'end', fill: 'var(--dwl-line)' }, 'tick-label line-label');
    lbl.textContent = MODE_LABELS[result.mode];
    g.appendChild(lbl);
    svg.appendChild(g);
    drawGapBracket(svg, result);
  } else if ((result.mode === 'tax' && !result.closed) || result.mode === 'subsidy') {
    // The consumer/producer reference lines only run from Q to the right edge — inside
    // the box (0 to Q) they'd sit exactly on top of the wedge outline's top/bottom edges,
    // and since these are drawn after the outline (see below) they'd paint over its dashes.
    // They're named on the axis (Pc/Pp, see drawAxisSymbols) — they mark prices, not the
    // burden/benefit, which is the shaded band between each line and Pe.
    const yc = sy(result.Pc), yp = sy(result.Pp);
    const xQ = sx(result.Q);
    svg.appendChild(el('line', { x1: xQ, y1: yc, x2: M.left + plotW, y2: yc, stroke: 'var(--demand)', 'stroke-width': 1.6, 'stroke-dasharray': '6,3' }, 'wedge-line'));
    svg.appendChild(el('line', { x1: xQ, y1: yp, x2: M.left + plotW, y2: yp, stroke: 'var(--supply)', 'stroke-width': 1.6, 'stroke-dasharray': '6,3' }, 'wedge-line'));
    // Outline drawn last so it renders on top of the reference lines above at their
    // shared corners (x=Q), keeping the box border crisp instead of getting erased. Grouped
    // under data-region (with a wide invisible hit-stroke, same trick as the ceiling/floor
    // line) so clicking the border explains total revenue/cost, distinct from clicking
    // inside either colored half which explains that side's incidence.
    const revenueG = el('g', { 'data-region': result.mode === 'subsidy' ? 'subsidy-cost' : 'tax-revenue' }, 'region region--line');
    revenueG.appendChild(el('polygon', { points: pts(result.wedgePoly), fill: 'none', stroke: 'transparent', 'stroke-width': 14 }, 'region-hit'));
    revenueG.appendChild(el('polygon', { points: pts(result.wedgePoly), fill: 'none', stroke: 'var(--gov)', 'stroke-width': 2.2, 'stroke-dasharray': '5,4' }, 'wedge-outline region-visible'));
    svg.appendChild(revenueG);
  } else if (result.requestedControl) {
    const { type, price } = result.requestedControl;
    const y = sy(price);
    svg.appendChild(el('line', { x1: M.left, y1: y, x2: M.left + plotW, y2: y, stroke: 'var(--ink-muted)', 'stroke-width': 1.4, 'stroke-dasharray': '4,4' }, 'wedge-line'));
    const lbl = el('text', { x: M.left + plotW - 6, y: y - 6, 'text-anchor': 'end', fill: 'var(--ink-muted)' }, 'tick-label');
    lbl.textContent = (type === 'floor' ? 'Price floor' : 'Price ceiling') + ' (not binding)';
    svg.appendChild(lbl);
  }
}

// Names an incidence band ("Consumer burden", ...) inside the band itself, only when the
// band is big enough to hold the text — a squeezed label is worse than none, and the
// legend + click-to-explain still name it.
function bandLabel(group, poly, text) {
  const top = Math.min(sy(poly[2][1]), sy(poly[1][1])), bottom = Math.max(sy(poly[2][1]), sy(poly[1][1]));
  const width = sx(poly[1][0]) - sx(poly[0][0]);
  if (bottom - top < 16 || width < 120) return;
  const t = el('text', { x: sx(poly[0][0]) + 8, y: (top + bottom) / 2 + 4, 'pointer-events': 'none' }, 'band-label');
  t.textContent = text;
  group.appendChild(t);
}

function ensureDynamicLayer(svg) {
  if (svg.dataset.chartInit === 'true') return svg.querySelector('.dynamic-layer');
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.setAttribute('viewBox', `0 0 ${VBW} ${VBH}`);
  drawGridAndAxes(svg);
  const layer = el('g', {}, 'dynamic-layer');
  svg.appendChild(layer);
  svg.dataset.chartInit = 'true';
  return layer;
}

export function renderMarketChart(svg, result) {
  const layer = ensureDynamicLayer(svg);
  while (layer.firstChild) layer.removeChild(layer.firstChild);

  if (!result.noTrade) {
    // Grouped under data-region so regionExplainers.js can hover/click the whole shaded
    // area as one unit (currently wired up on the price-ceiling page only).
    const csG = el('g', { 'data-region': 'cs' }, 'region region--fill');
    csG.appendChild(el('polygon', { points: pts(result.csPoly), fill: 'var(--demand-fill)' }, 'cs-fill'));
    layer.appendChild(csG);
    const psG = el('g', { 'data-region': 'ps' }, 'region region--fill');
    psG.appendChild(el('polygon', { points: pts(result.psPoly), fill: 'var(--supply-fill)' }, 'ps-fill'));
    layer.appendChild(psG);
    if (result.mode === 'tax' || result.mode === 'subsidy') {
      // The wedge is split at the pre-intervention price into a consumer-incidence portion
      // (tinted with the demand color) and a producer-incidence portion (tinted with the
      // supply color), so the split itself — not just its dollar value in the stats panel —
      // visibly tracks relative elasticity as the sliders move.
      // For a subsidy the CS/PS surplus regions grow past the free-market baseline and
      // geometrically overlap this same band (unlike a tax, where they shrink away from
      // it), so an opaque backing polygon goes down first — otherwise the translucent
      // wedge tint would blend with the translucent surplus fill underneath and read
      // muddy on the subsidy page even though the tokens are identical to the tax page.
      // This fill step runs before both the DWL hatch (the DWL triangle sits inside this
      // same wedge rectangle, so it must be drawn after or the opaque backing erases it)
      // and the curves/gridlines/equilibrium dot (unlike the wedge outline and price
      // lines, which stay layered on top of those in drawWedgeLines below).
      const isSubsidy = result.mode === 'subsidy';
      const consumerG = el('g', { 'data-region': isSubsidy ? 'subsidy-consumer' : 'tax-consumer' }, 'region region--fill');
      consumerG.appendChild(el('polygon', { points: pts(result.consumerWedgePoly), fill: 'var(--surface)' }, 'wedge-backing'));
      consumerG.appendChild(el('polygon', { points: pts(result.consumerWedgePoly), fill: 'var(--demand-alt-fill)' }, 'wedge-fill wedge-fill--consumer'));
      bandLabel(consumerG, result.consumerWedgePoly, isSubsidy ? 'Consumer benefit' : 'Consumer burden');
      layer.appendChild(consumerG);
      const producerG = el('g', { 'data-region': isSubsidy ? 'subsidy-producer' : 'tax-producer' }, 'region region--fill');
      producerG.appendChild(el('polygon', { points: pts(result.producerWedgePoly), fill: 'var(--surface)' }, 'wedge-backing'));
      producerG.appendChild(el('polygon', { points: pts(result.producerWedgePoly), fill: 'var(--supply-alt-fill)' }, 'wedge-fill wedge-fill--producer'));
      bandLabel(producerG, result.producerWedgePoly, isSubsidy ? 'Producer benefit' : 'Producer burden');
      layer.appendChild(producerG);
    }
    if (result.dwlPoly) {
      // For a tax or subsidy the DWL triangle sits inside the consumer/producer wedge
      // fill drawn above, and both are translucent — without an opaque backing the
      // wedge's demand-alt/supply-alt tint shows through the DWL hatch, reading as a
      // yellowish/bluish tinge instead of plain DWL red.
      const dwlG = el('g', { 'data-region': 'dwl' }, 'region region--fill');
      dwlG.appendChild(el('polygon', { points: pts(result.dwlPoly), fill: 'var(--surface)' }, 'dwl-backing'));
      dwlG.appendChild(el('polygon', { points: pts(result.dwlPoly), fill: 'url(#dwlHatch)' }, 'dwl-fill'));
      dwlG.appendChild(el('polygon', { points: pts(result.dwlPoly), fill: 'none', stroke: 'var(--dwl-line)', 'stroke-width': 1.3, 'stroke-dasharray': '3,2' }, 'dwl-outline'));
      layer.appendChild(dwlG);
    }
  }

  const shifted = shiftedSupplyParams(result);

  const dSeg = clipDemand(result.Dmax, result.slopeD), sSeg = clipSupply(result.Smin, result.slopeS);
  layer.appendChild(el('line', { x1: sx(dSeg[0][0]), y1: sy(dSeg[0][1]), x2: sx(dSeg[1][0]), y2: sy(dSeg[1][1]), stroke: 'var(--demand)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, 'demand-curve'));
  layer.appendChild(el('line', {
    x1: sx(sSeg[0][0]), y1: sy(sSeg[0][1]), x2: sx(sSeg[1][0]), y2: sy(sSeg[1][1]),
    stroke: 'var(--supply)', 'stroke-width': shifted ? 1.6 : 2.5, 'stroke-linecap': 'round',
    ...(shifted ? { 'stroke-dasharray': '6,4', 'stroke-opacity': '0.55' } : {}),
  }, 'supply-curve'));

  const dLbl = el('text', { x: sx(dSeg[0][0]) + 8, y: sy(dSeg[0][1]) - 6, fill: 'var(--demand)' }, 'curve-label');
  dLbl.textContent = 'Demand';
  layer.appendChild(dLbl);

  if (shifted) {
    // Two supply lines on screen: label them S1 (original) / S2 (after the intervention)
    // instead of prose ("Supply (before)" / "Supply + tax") — shorter labels are far less
    // likely to collide with the Pc/Pp wedge labels once curves are dragged around.
    // Both sit at their own line's right-hand endpoint (not S1 on the left, S2 on the
    // right) so they read as a matched pair and never land near the Demand label on the left.
    const sLbl = subscriptLabel('S', '1', { x: sx(sSeg[1][0]) - 8, y: sy(sSeg[1][1]) - 8, fill: 'var(--supply)', 'text-anchor': 'end', 'fill-opacity': '0.6' });
    layer.appendChild(sLbl);

    const s2Seg = clipSupply(shifted.Smin, shifted.slopeS);
    layer.appendChild(el('line', { x1: sx(s2Seg[0][0]), y1: sy(s2Seg[0][1]), x2: sx(s2Seg[1][0]), y2: sy(s2Seg[1][1]), stroke: 'var(--supply)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, 'supply-curve-shifted'));
    const s2Lbl = subscriptLabel('S', '2', { x: sx(s2Seg[1][0]) - 8, y: sy(s2Seg[1][1]) - 8, fill: 'var(--supply)', 'text-anchor': 'end' });
    layer.appendChild(s2Lbl);
  } else {
    const sLbl = el('text', { x: sx(sSeg[1][0]) - 8, y: sy(sSeg[1][1]) - 8, fill: 'var(--supply)', 'text-anchor': 'end' }, 'curve-label');
    sLbl.textContent = 'Supply';
    layer.appendChild(sLbl);
  }

  if (!result.noTrade) {
    layer.appendChild(el('line', { x1: sx(result.Qstar), y1: sy(result.Pstar), x2: sx(result.Qstar), y2: M.top + plotH, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '3,3' }));
    layer.appendChild(el('line', { x1: M.left, y1: sy(result.Pstar), x2: sx(result.Qstar), y2: sy(result.Pstar), stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '3,3' }));
    layer.appendChild(el('circle', { cx: sx(result.Qstar), cy: sy(result.Pstar), r: 4.5, fill: 'var(--ink)' }));

    drawWedgeLines(layer, result);

    if (result.mode === 'ceiling' || result.mode === 'floor') {
      // Both ends of the shortage/excess supply: the point on each curve at the control
      // price, each dropped to its Qs/Qd label on the axis (Qd can sit past the edge).
      for (const q of [result.qs, result.qd]) {
        if (q > QMAX) continue;
        layer.appendChild(el('line', { x1: sx(q), y1: sy(result.Pc), x2: sx(q), y2: M.top + plotH, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '1,3' }));
        layer.appendChild(el('circle', { cx: sx(q), cy: sy(result.Pc), r: 4, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 1.8 }, 'control-point'));
      }
    } else if ((result.mode === 'tax' && !result.closed) || result.mode === 'subsidy') {
      layer.appendChild(el('line', { x1: sx(result.Q), y1: sy(result.Pc), x2: sx(result.Q), y2: M.top + plotH, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '1,3' }));
      layer.appendChild(el('circle', { cx: sx(result.Q), cy: sy(result.Pc), r: 4, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 1.8 }));
    }
  }

  if (result.noTrade) {
    svg.querySelectorAll('.tick-label[data-axis]').forEach((tick) => tick.setAttribute('visibility', 'visible'));
  } else {
    drawAxisSymbols(svg, layer, result);
  }
}

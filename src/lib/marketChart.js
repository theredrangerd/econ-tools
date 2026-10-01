import { QMAX, PMAX } from './marketEngine.js';

// The chart is drawn in real CSS pixels: the viewBox is sized to the SVG's rendered width
// (see sizeChart), so 1 user unit = 1 screen px and every font size below is the size the
// student actually sees — a fixed 780-wide viewBox scaled down to a 640px card (or a
// 340px phone) shrank 12px labels to 10px (or 5px), unreadable on a projector.
// Margins leave room for 3-digit tick labels + the rotated axis title on the left, and
// tick labels/axis symbols + the axis title underneath.
const M = { left: 62, right: 18, top: 18, bottom: 58 };
// Fallback width when layout gives none (jsdom, or a chart not yet in the document).
const DEFAULT_W = 780;
let VBW = DEFAULT_W, VBH = 520, plotW = 0, plotH = 0;

// Wide charts keep the familiar 3:2 frame; narrow ones (phones, where the columns stack)
// get relatively taller so the plot area doesn't collapse into a strip once the fixed-size
// margins are taken out.
function sizeChart(width) {
  VBW = Math.round(width);
  // Blend from 3:2 at 560px to roughly square at phone width (~340px).
  const t = Math.min(1, Math.max(0, (560 - width) / 220));
  VBH = Math.round(width * ((2 / 3) + t * (1.02 - 2 / 3)));
  plotW = VBW - M.left - M.right;
  plotH = VBH - M.top - M.bottom;
}
sizeChart(DEFAULT_W);

// Type scale in screen px (roughly 1.15 steps): ticks 13 → labels 14 → axis symbols 16.
const TICK_PX = 13;
const TICK_Y = 22; // tick-label / x-axis symbol baseline, below the plot

function clampN(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function sx(q) { return M.left + (q / QMAX) * plotW; }
// No clamping: squashing an off-chart price flattens polygon corners (e.g. the tip of a
// CS triangle whose steep demand curve starts far above PMAX), so the shading stops
// following the curve. Fills are clipped to the plot area with #plotClip instead.
function sy(p) { return M.top + plotH - (p / PMAX) * plotH; }

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
  const clip = el('clipPath', { id: 'plotClip' });
  clip.appendChild(el('rect', { x: M.left, y: M.top, width: plotW, height: plotH }));
  defs.appendChild(clip);
  svg.appendChild(defs);

  svg.appendChild(el('rect', { x: M.left, y: M.top, width: plotW, height: plotH, fill: 'var(--surface)', stroke: 'none' }));

  const g = el('g');
  for (let qq = 0; qq <= QMAX; qq += 20) {
    g.appendChild(el('line', { x1: sx(qq), y1: M.top, x2: sx(qq), y2: M.top + plotH, stroke: 'var(--hairline)', 'stroke-width': 1 }));
    const lbl = el('text', { x: sx(qq), y: M.top + plotH + TICK_Y, 'text-anchor': 'middle', 'data-axis': 'x', 'data-pos': sx(qq) }, 'tick-label');
    lbl.textContent = qq;
    g.appendChild(lbl);
  }
  for (let pp = 0; pp <= PMAX; pp += 20) {
    g.appendChild(el('line', { x1: M.left, y1: sy(pp), x2: M.left + plotW, y2: sy(pp), stroke: 'var(--hairline)', 'stroke-width': 1 }));
    const plbl = el('text', { x: M.left - 10, y: sy(pp) + TICK_PX * 0.35, 'text-anchor': 'end', 'data-axis': 'y', 'data-pos': sy(pp) }, 'tick-label');
    plbl.textContent = pp;
    g.appendChild(plbl);
  }
  svg.appendChild(g);

  svg.appendChild(el('line', { x1: M.left, y1: M.top, x2: M.left, y2: M.top + plotH, stroke: 'var(--hairline-2)', 'stroke-width': 1.5 }));
  svg.appendChild(el('line', { x1: M.left, y1: M.top + plotH, x2: M.left + plotW, y2: M.top + plotH, stroke: 'var(--hairline-2)', 'stroke-width': 1.5 }));

  const xl = el('text', { x: M.left + plotW / 2, y: VBH - 8, 'text-anchor': 'middle' }, 'axis-label');
  xl.textContent = 'Quantity (units)';
  svg.appendChild(xl);
  const yl = el('text', { x: 14, y: M.top + plotH / 2, 'text-anchor': 'middle', transform: `rotate(-90 14 ${M.top + plotH / 2})` }, 'axis-label');
  yl.textContent = 'Price ($ / unit)';
  svg.appendChild(yl);
}

// A binding ceiling/floor: one control-price line, with Qs/Qd either side of it.
function isPriceControl(result) {
  return result.mode === 'ceiling' || result.mode === 'floor';
}

// A tax or subsidy that still trades: separate Pc/Pp lines and a Q1 point. A tax big
// enough to close the market has no traded price, so none of these marks are drawn.
function hasOpenWedge(result) {
  return (result.mode === 'tax' && !result.closed) || result.mode === 'subsidy';
}

const MODE_LABELS = {
  ceiling: 'Price ceiling',
  floor: 'Price floor',
};

// Distance from its equilibrium symbol (Pe/Qe) at which an intervention symbol reaches
// full size. Chosen so two symbols centred on their lines stop overlapping at ~40% size
// (below that they're tiny, fading, and drawn under Pe/Qe's halo).
// Both scale with SYMBOL_PX: a symbol with its subscript is ~1.3em tall and ~1.1em wide,
// plus clearance. (Kept tight enough that the default $20 tax shows Pc/Pp at full size.)
const SYMBOL_PX = 16;
const Y_GAP = Math.round(SYMBOL_PX * 1.4);
const X_GAP = Math.round(SYMBOL_PX * 1.75);
// Growth starts this far out from Pe/Qe: Pe's hanging subscript needs ~3px more room than
// the centred-glyph estimate, and at this distance the symbol would be <1px tall anyway.
const SYMBOL_DEAD_ZONE = 3;

// The IB-style symbols a result puts on each axis: Pe/Qe for the free-market equilibrium
// (always, so the before/after comparison stays readable), plus whatever prices and
// quantities the intervention creates (`ref: false`).
function axisSymbols(result) {
  const y = [{ base: 'P', sub: 'e', v: result.Pstar, ref: true }];
  const x = [{ base: 'Q', sub: 'e', v: result.Qstar, ref: true }];
  if (isPriceControl(result)) {
    y.push({ base: 'P', sub: result.mode === 'ceiling' ? 'max' : 'min', v: result.Pc });
    x.push({ base: 'Q', sub: 's', v: result.qs }, { base: 'Q', sub: 'd', v: result.qd });
  } else if (hasOpenWedge(result)) {
    y.push({ base: 'P', sub: 'c', v: result.Pc }, { base: 'P', sub: 'p', v: result.Pp });
    x.push({ base: 'Q', sub: '1', v: result.Q });
  }
  const place = (syms, pos, gap) => {
    const withPos = syms.map((s) => ({ ...s, pos: pos(s.v) }));
    const refPos = withPos[0].pos;
    // Every symbol stays exactly on its own line. An intervention symbol closing in on its
    // equilibrium symbol shrinks in proportion to the distance instead of being pushed
    // aside, so it never sits off its line or covers Pe/Qe, and it vanishes at exactly
    // zero intervention (e.g. tax = 0, where Pc = Pp = Pe).
    return withPos
      .map((s) => ({ ...s, scale: s.ref ? 1 : Math.min(1, Math.max(0, Math.abs(s.pos - refPos) - SYMBOL_DEAD_ZONE) / (gap - SYMBOL_DEAD_ZONE)) }))
      .filter((s) => s.scale > 0.05);
  };
  return {
    y: place(y, sy, Y_GAP),
    x: place(x.filter((s) => s.v >= 0 && s.v <= QMAX), sx, X_GAP),
  };
}

function drawAxisSymbols(svg, layer, result) {
  const { x, y } = axisSymbols(result);
  // Equilibrium symbols last, with a halo in the card colour, so a shrinking intervention
  // symbol that brushes Pe/Qe passes underneath rather than over it.
  const order = (syms) => [...syms].sort((a, b) => Number(a.ref ?? false) - Number(b.ref ?? false));
  const cls = (s) => (s.ref ? 'axis-symbol axis-symbol--ref' : 'axis-symbol');
  // Fade in the last stretch before vanishing, so a symbol too small to read doesn't
  // linger as a speck.
  const size = (s) => ({ 'font-size': (SYMBOL_PX * s.scale).toFixed(2), opacity: Math.min(1, 2 * s.scale).toFixed(2) });
  // Baseline 0.2em below the line centres the glyphs (cap height ~0.7em above the
  // baseline, subscript ~0.3em below) on the price they label.
  for (const s of order(y)) {
    layer.appendChild(subscriptLabel(s.base, s.sub, { x: M.left - 10, y: s.pos + 0.2 * SYMBOL_PX * s.scale, 'text-anchor': 'end', ...size(s) }, cls(s)));
  }
  for (const s of order(x)) {
    layer.appendChild(subscriptLabel(s.base, s.sub, { x: s.pos, y: M.top + plotH + TICK_Y, 'text-anchor': 'middle', ...size(s) }, cls(s)));
  }
  // Hide any numeric tick that a symbol now sits on top of. On y the symbol isn't
  // symmetric about its line: the subscript (e.g. "max") hangs ~0.5em further below, so a
  // tick just under a symbol needs more clearance than one just above it.
  const clear = (s, tickPos) => {
    const d = tickPos - s.pos; // > 0: tick is below the symbol
    return d > 0 ? d >= SYMBOL_PX * s.scale * 0.6 + TICK_PX : -d >= TICK_PX + 3;
  };
  svg.querySelectorAll('.tick-label[data-axis]').forEach((tick) => {
    const pos = +tick.dataset.pos;
    const hidden = tick.dataset.axis === 'x'
      ? x.some((s) => Math.abs(s.pos - pos) < X_GAP)
      : y.some((s) => !clear(s, pos));
    tick.setAttribute('visibility', hidden ? 'hidden' : 'visible');
  });
}

// The shortage (ceiling) or excess supply (floor): a bracket along the control price from
// the smaller of Qs/Qd to the larger, labelled, on the side of the line where there's
// empty space (below a ceiling, above a floor). Clipped with an arrow at the chart edge
// when Qd/Qs lies past it — the note still reports the full amount.
// Room the bracket + its label need on one side of the control line.
const BRACKET_ROOM = 34;

// Below a ceiling / above a floor is normally the empty side, but a ceiling near $0 or a
// floor near the top of the chart leaves no room there, so the bracket flips across the
// line rather than spilling out of the plot (the name label flips with it; see below).
function bracketBelow(result) {
  const yLine = sy(result.Pc);
  const roomBelow = M.top + plotH - yLine, roomAbove = yLine - M.top;
  if (result.mode === 'ceiling') return roomBelow >= BRACKET_ROOM || roomBelow >= roomAbove;
  return !(roomAbove >= BRACKET_ROOM || roomAbove >= roomBelow);
}

function drawGapBracket(layer, result) {
  const isCeiling = result.mode === 'ceiling';
  const below = bracketBelow(result);
  const q0 = Math.min(result.qd, result.qs), q1 = Math.max(result.qd, result.qs);
  const x0 = sx(q0), x1 = sx(Math.min(q1, QMAX));
  if (x1 - x0 < 2) return;
  const clipped = q1 > QMAX;
  const yLine = sy(result.Pc);
  const y = below ? yLine + 12 : yLine - 12;
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
  const lbl = el('text', { x: (x0 + x1) / 2, y: below ? y + 17 : y - 8, 'text-anchor': 'middle', fill: 'var(--ink)' }, 'bracket-label');
  lbl.textContent = isCeiling ? 'Shortage' : 'Excess supply';
  g.appendChild(lbl);
  layer.appendChild(g);
}

function drawWedgeLines(svg, result) {
  if (isPriceControl(result)) {
    const y = sy(result.Pc);
    // Grouped under data-region so regionExplainers.js can hover/click it as a unit; the
    // wide transparent line gives the thin dashed line a comfortably large hit target.
    const g = el('g', { 'data-region': result.mode }, 'region region--line');
    g.appendChild(el('line', { x1: M.left, y1: y, x2: M.left + plotW, y2: y, stroke: 'transparent', 'stroke-width': 18 }, 'region-hit'));
    g.appendChild(el('line', { x1: M.left, y1: y, x2: M.left + plotW, y2: y, stroke: 'var(--dwl-line)', 'stroke-width': 1.6, 'stroke-dasharray': '6,3' }, 'wedge-line region-visible'));
    // Name label on the opposite side of the line from the gap bracket, so the two can't
    // collide when Qd/Qs reaches the right edge.
    // (Its own class, not .tick-label: that rule's grey fill would override this red.)
    const lbl = el('text', { x: M.left + plotW - 6, y: bracketBelow(result) ? y - 7 : y + 17, 'text-anchor': 'end', fill: 'var(--dwl-line)' }, 'line-label');
    lbl.textContent = MODE_LABELS[result.mode];
    g.appendChild(lbl);
    svg.appendChild(g);
    drawGapBracket(svg, result);
  } else if (hasOpenWedge(result)) {
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
    const lbl = el('text', { x: M.left + plotW - 6, y: y - 7, 'text-anchor': 'end', fill: 'var(--ink-secondary)' }, 'line-label line-label--muted');
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
  if (bottom - top < 18 || width < 136) return;
  const t = el('text', { x: sx(poly[0][0]) + 8, y: (top + bottom) / 2 + 4.5, 'pointer-events': 'none' }, 'band-label');
  t.textContent = text;
  group.appendChild(t);
}

// A curve that leaves the chart through the top edge would put its name above the plot,
// clipped by the card; keep the baseline one label-height inside instead.
const CURVE_LABEL_PX = 14;
function labelY(y) { return Math.max(y, M.top + CURVE_LABEL_PX); }

// The Demand name sits at the curve's top-left end, which is exactly where a high floor's
// line and excess-supply bracket run. If they'd overlap, step the name past the bracket
// band (the side away from the line), so the two labels never print over each other.
function demandLabelY(result, y) {
  y = labelY(y);
  if (!isPriceControl(result) || result.noTrade) return y;
  const yLine = sy(result.Pc);
  const below = bracketBelow(result);
  const bandTop = below ? yLine - 4 : yLine - BRACKET_ROOM - 4;
  const bandBottom = below ? yLine + BRACKET_ROOM : yLine + 4;
  if (y < bandTop || y - CURVE_LABEL_PX > bandBottom) return y;
  return below ? bandBottom + CURVE_LABEL_PX + 2 : labelY(bandTop - 2);
}

function measuredWidth(svg) {
  const w = svg.clientWidth || (svg.getBoundingClientRect ? svg.getBoundingClientRect().width : 0);
  return w > 0 ? w : DEFAULT_W;
}

// Computes the visual centroid of a polygon in screen coordinates so that region labels
// (CS, PS, DWL) can sit inside their respective areas. Clamps to the visible plot bounds.
function polygonCentroid(poly) {
  if (!poly || poly.length < 3) return null;
  const pts = poly.map(([q, p]) => [sx(q), sy(p)]);
  let signedArea = 0;
  let cx = 0;
  let cy = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const a = x0 * y1 - x1 * y0;
    signedArea += a;
    cx += (x0 + x1) * a;
    cy += (y0 + y1) * a;
  }
  signedArea *= 0.5;
  const absArea = Math.abs(signedArea);
  // Omit the badge if the polygon is too small to comfortably display it without crowding.
  if (absArea < 180) return null;
  let x = cx / (6 * signedArea);
  let y = cy / (6 * signedArea);
  x = Math.max(M.left + 22, Math.min(M.left + plotW - 22, x));
  y = Math.max(M.top + 14, Math.min(M.top + plotH - 14, y));
  return { x, y, area: absArea };
}

// Renders an interactive pill-badge with category styling inside a chart region.
function drawRegionBadge(layer, { id, text, center, colorVar, title }) {
  if (!center) return;
  const g = el('g', {
    'data-region': id,
    transform: `translate(${center.x.toFixed(1)}, ${center.y.toFixed(1)})`,
    role: 'button',
    tabindex: '0',
    'aria-label': `${title} (${text}) — click for explanation`,
  }, `region-badge region-badge--${id} region`);

  const pillW = text.length > 2 ? 40 : 34;
  const pillH = 22;
  const r = 11;

  // Larger transparent hit area
  g.appendChild(el('rect', {
    x: -pillW / 2 - 6,
    y: -pillH / 2 - 6,
    width: pillW + 12,
    height: pillH + 12,
    fill: 'transparent',
  }, 'region-hit'));

  // Crisp pill background
  g.appendChild(el('rect', {
    x: -pillW / 2,
    y: -pillH / 2,
    width: pillW,
    height: pillH,
    rx: r,
    ry: r,
    fill: 'var(--surface)',
    stroke: `var(--${colorVar})`,
    'stroke-width': '1.6',
  }, 'region-badge__pill'));

  // Label text
  const txt = el('text', {
    x: 0,
    y: 0.5,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    fill: `var(--${colorVar})`,
    'font-size': '11.5px',
    'font-weight': '700',
    'font-family': '"IBM Plex Sans", sans-serif',
    'letter-spacing': '0.5px',
  }, 'region-badge__text');
  txt.textContent = text;
  g.appendChild(txt);

  layer.appendChild(g);
}

// Draws CS, PS, and DWL region badges when enabled.
function drawSurplusBadges(layer, result) {
  const badgeLayer = el('g', {}, 'surplus-badges');
  if (result.csPoly && result.csPoly.length >= 3) {
    const c = polygonCentroid(result.csPoly);
    if (c) {
      drawRegionBadge(badgeLayer, {
        id: 'cs',
        text: 'CS',
        center: c,
        colorVar: 'demand',
        title: 'Consumer Surplus',
      });
    }
  }
  if (result.psPoly && result.psPoly.length >= 3) {
    const c = polygonCentroid(result.psPoly);
    if (c) {
      drawRegionBadge(badgeLayer, {
        id: 'ps',
        text: 'PS',
        center: c,
        colorVar: 'supply',
        title: 'Producer Surplus',
      });
    }
  }
  if (result.dwlPoly && result.dwlPoly.length >= 3) {
    const c = polygonCentroid(result.dwlPoly);
    if (c) {
      drawRegionBadge(badgeLayer, {
        id: 'dwl',
        text: 'DWL',
        center: c,
        colorVar: 'dwl-line',
        title: 'Deadweight Loss',
      });
    }
  }
  layer.appendChild(badgeLayer);
}

// Redraws at the new pixel size whenever the card changes width (window resize, the
// columns stacking at the mobile breakpoint), replaying the last result.
function watchSize(svg) {
  if (svg._chartObserver || typeof ResizeObserver === 'undefined') return;
  svg._chartObserver = new ResizeObserver(() => {
    if (!svg._lastResult || Math.abs(measuredWidth(svg) - +svg.dataset.chartW) < 1) return;
    renderMarketChart(svg, svg._lastResult, svg._lastOptions);
  });
  svg._chartObserver.observe(svg);
}

function ensureDynamicLayer(svg) {
  const width = measuredWidth(svg);
  // sizeChart() sets module-level geometry, so run it on every render: two charts of
  // different widths on one page must each draw against their own size.
  sizeChart(width);
  if (svg.dataset.chartInit === 'true' && Math.abs(width - +svg.dataset.chartW) < 1) return svg.querySelector('.dynamic-layer');
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.dataset.chartW = String(width);
  svg.setAttribute('viewBox', `0 0 ${VBW} ${VBH}`);
  drawGridAndAxes(svg);
  const layer = el('g', {}, 'dynamic-layer');
  svg.appendChild(layer);
  svg.dataset.chartInit = 'true';
  return layer;
}

export function renderMarketChart(svg, result, options = {}) {
  svg._lastResult = result;
  svg._lastOptions = options;
  watchSize(svg);
  const layer = ensureDynamicLayer(svg);
  while (layer.firstChild) layer.removeChild(layer.firstChild);

  if (!result.noTrade) {
    // All shaded regions go in one group clipped to the plot area, so a region whose true
    // shape runs past the axes (steep curves) is cut off at the edge rather than distorted.
    const fills = el('g', { 'clip-path': 'url(#plotClip)' }, 'fills');
    layer.appendChild(fills);
    // Grouped under data-region so regionExplainers.js can hover/click the whole shaded
    // area as one unit (currently wired up on the price-ceiling page only).
    const csG = el('g', { 'data-region': 'cs' }, 'region region--fill');
    csG.appendChild(el('polygon', { points: pts(result.csPoly), fill: 'var(--demand-fill)' }, 'cs-fill'));
    fills.appendChild(csG);
    const psG = el('g', { 'data-region': 'ps' }, 'region region--fill');
    psG.appendChild(el('polygon', { points: pts(result.psPoly), fill: 'var(--supply-fill)' }, 'ps-fill'));
    fills.appendChild(psG);
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
      fills.appendChild(consumerG);
      const producerG = el('g', { 'data-region': isSubsidy ? 'subsidy-producer' : 'tax-producer' }, 'region region--fill');
      producerG.appendChild(el('polygon', { points: pts(result.producerWedgePoly), fill: 'var(--surface)' }, 'wedge-backing'));
      producerG.appendChild(el('polygon', { points: pts(result.producerWedgePoly), fill: 'var(--supply-alt-fill)' }, 'wedge-fill wedge-fill--producer'));
      bandLabel(producerG, result.producerWedgePoly, isSubsidy ? 'Producer benefit' : 'Producer burden');
      fills.appendChild(producerG);
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
      fills.appendChild(dwlG);
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

  const dLbl = el('text', { x: sx(dSeg[0][0]) + 10, y: demandLabelY(result, sy(dSeg[0][1]) - 7), fill: 'var(--demand)' }, 'curve-label');
  dLbl.textContent = 'Demand';
  layer.appendChild(dLbl);

  if (shifted) {
    // Two supply lines on screen: label them S1 (original) / S2 (after the intervention)
    // instead of prose ("Supply (before)" / "Supply + tax") — shorter labels are far less
    // likely to collide with the Pc/Pp wedge labels once curves are dragged around.
    // Both sit at their own line's right-hand endpoint (not S1 on the left, S2 on the
    // right) so they read as a matched pair and never land near the Demand label on the left.
    const sLbl = subscriptLabel('S', '1', { x: sx(sSeg[1][0]) - 10, y: labelY(sy(sSeg[1][1]) - 8), fill: 'var(--supply)', 'text-anchor': 'end', 'fill-opacity': '0.6' });
    layer.appendChild(sLbl);

    const s2Seg = clipSupply(shifted.Smin, shifted.slopeS);
    layer.appendChild(el('line', { x1: sx(s2Seg[0][0]), y1: sy(s2Seg[0][1]), x2: sx(s2Seg[1][0]), y2: sy(s2Seg[1][1]), stroke: 'var(--supply)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, 'supply-curve-shifted'));
    const s2Lbl = subscriptLabel('S', '2', { x: sx(s2Seg[1][0]) - 10, y: labelY(sy(s2Seg[1][1]) - 8), fill: 'var(--supply)', 'text-anchor': 'end' });
    layer.appendChild(s2Lbl);
  } else {
    const sLbl = el('text', { x: sx(sSeg[1][0]) - 10, y: labelY(sy(sSeg[1][1]) - 8), fill: 'var(--supply)', 'text-anchor': 'end' }, 'curve-label');
    sLbl.textContent = 'Supply';
    layer.appendChild(sLbl);
  }

  if (!result.noTrade) {
    layer.appendChild(el('line', { x1: sx(result.Qstar), y1: sy(result.Pstar), x2: sx(result.Qstar), y2: M.top + plotH, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '3,3' }));
    layer.appendChild(el('line', { x1: M.left, y1: sy(result.Pstar), x2: sx(result.Qstar), y2: sy(result.Pstar), stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '3,3' }));
    layer.appendChild(el('circle', { cx: sx(result.Qstar), cy: sy(result.Pstar), r: 4.5, fill: 'var(--ink)' }));

    drawWedgeLines(layer, result);

    if (isPriceControl(result)) {
      // Both ends of the shortage/excess supply: the point on each curve at the control
      // price, each dropped to its Qs/Qd label on the axis (Qd can sit past the edge).
      for (const q of [result.qs, result.qd]) {
        if (q > QMAX) continue;
        layer.appendChild(el('line', { x1: sx(q), y1: sy(result.Pc), x2: sx(q), y2: M.top + plotH, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '1,3' }));
        layer.appendChild(el('circle', { cx: sx(q), cy: sy(result.Pc), r: 4, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 1.8 }, 'control-point'));
      }
    } else if (hasOpenWedge(result)) {
      layer.appendChild(el('line', { x1: sx(result.Q), y1: sy(result.Pc), x2: sx(result.Q), y2: M.top + plotH, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '1,3' }));
      layer.appendChild(el('circle', { cx: sx(result.Q), cy: sy(result.Pc), r: 4, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 1.8 }));
    }

    const showSurplusLabels = options.showSurplusLabels ?? result.showSurplusLabels ?? false;
    if (showSurplusLabels) {
      drawSurplusBadges(layer, result);
    }
  }

  if (result.noTrade) {
    svg.querySelectorAll('.tick-label[data-axis]').forEach((tick) => tick.setAttribute('visibility', 'visible'));
  } else {
    drawAxisSymbols(svg, layer, result);
  }
}

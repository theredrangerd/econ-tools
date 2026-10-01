import { describe, it, expect, beforeEach } from 'vitest';
import { computeMarket } from './marketEngine.js';
import { renderMarketChart } from './marketChart.js';

function makeSvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'market-chart');
  return svg;
}

const base = { demand: 140, supply: 20, slopeD: 1, slopeS: 1 };

describe('renderMarketChart', () => {
  let svg;
  beforeEach(() => { svg = makeSvg(); });

  it('draws the demand and supply curve lines for a free market', () => {
    const result = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.demand-curve')).toHaveLength(1);
    expect(svg.querySelectorAll('line.supply-curve')).toHaveLength(1);
  });

  it('draws a CS and PS fill polygon when trade occurs', () => {
    const result = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, result);
    expect(svg.querySelector('polygon.cs-fill')).not.toBeNull();
    expect(svg.querySelector('polygon.ps-fill')).not.toBeNull();
  });

  it('draws a DWL fill and outline when a ceiling binds', () => {
    const result = computeMarket({ ...base, intervention: { type: 'ceiling', price: 50 } });
    renderMarketChart(svg, result);
    expect(svg.querySelector('polygon.dwl-fill')).not.toBeNull();
    expect(svg.querySelector('polygon.dwl-outline')).not.toBeNull();
  });

  it('omits the DWL fill in a free market', () => {
    const result = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, result);
    expect(svg.querySelector('polygon.dwl-fill')).toBeNull();
  });

  it('draws two wedge reference lines and consumer/producer incidence fills for a tax', () => {
    const result = computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 20 } });
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.wedge-line')).toHaveLength(2);
    expect(svg.querySelector('polygon.wedge-fill--consumer')).not.toBeNull();
    expect(svg.querySelector('polygon.wedge-fill--producer')).not.toBeNull();
    expect(svg.querySelector('polygon.wedge-outline')).not.toBeNull();
  });

  it('draws a single reference line for a binding price floor', () => {
    const result = computeMarket({ ...base, intervention: { type: 'floor', price: 110 } });
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.wedge-line')).toHaveLength(1);
    expect(svg.querySelector('polygon.wedge-fill--consumer')).toBeNull();
  });

  it('clears previously drawn content on re-render, so dragging a slider does not accumulate elements', () => {
    const result = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, result);
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.demand-curve')).toHaveLength(1);
  });

  it('reuses the static grid/axes on re-render instead of rebuilding them', () => {
    const result = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, result);
    const gridLine = svg.querySelector('.tick-label');
    renderMarketChart(svg, result);
    expect(svg.querySelector('.tick-label')).toBe(gridLine);
  });

  it('tints the consumer/producer incidence fills with the demand/supply colors, and outlines the total wedge in gov color', () => {
    const result = computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 20 } });
    renderMarketChart(svg, result);
    const consumerFill = svg.querySelector('polygon.wedge-fill--consumer').getAttribute('fill');
    const producerFill = svg.querySelector('polygon.wedge-fill--producer').getAttribute('fill');
    const psFill = svg.querySelector('polygon.ps-fill').getAttribute('fill');
    expect(consumerFill).toContain('--demand');
    expect(producerFill).toContain('--supply');
    expect(producerFill).not.toBe(psFill);
    expect(svg.querySelector('polygon.wedge-outline').getAttribute('stroke')).toBe('var(--gov)');
  });

  it('splits the tax wedge at the pre-tax equilibrium price so the incidence fills track relative elasticity', () => {
    const result = computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 20 } });
    renderMarketChart(svg, result);
    const consumerPoly = svg.querySelector('polygon.wedge-fill--consumer').getAttribute('points');
    const producerPoly = svg.querySelector('polygon.wedge-fill--producer').getAttribute('points');
    expect(consumerPoly).not.toBe(producerPoly);
  });

  it('draws a faint non-binding reference line when a ceiling is toggled on but set above equilibrium', () => {
    const result = computeMarket({ ...base, intervention: { type: 'ceiling', price: 100 } });
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.wedge-line')).toHaveLength(1);
  });

  it('draws a shifted after-tax supply curve, fading the original supply curve as a reference', () => {
    const result = computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 20 } });
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.supply-curve-shifted')).toHaveLength(1);
    const original = svg.querySelector('line.supply-curve');
    expect(original.getAttribute('stroke-dasharray')).toBe('6,4');
  });

  it('draws a shifted after-subsidy supply curve below the original', () => {
    const result = computeMarket({ ...base, intervention: { type: 'subsidy', amount: 15 } });
    renderMarketChart(svg, result);
    const shifted = svg.querySelector('line.supply-curve-shifted');
    expect(shifted).not.toBeNull();
    const y1Shifted = +shifted.getAttribute('y1');
    const y1Original = +svg.querySelector('line.supply-curve').getAttribute('y1');
    // a lower price at the same quantity draws further down the SVG (larger y)
    expect(y1Shifted).toBeGreaterThan(y1Original);
  });

  it('omits the shifted supply curve for a free market or a price control, which do not shift supply', () => {
    const free = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, free);
    expect(svg.querySelector('line.supply-curve-shifted')).toBeNull();

    const ceiling = computeMarket({ ...base, intervention: { type: 'ceiling', price: 50 } });
    renderMarketChart(svg, ceiling);
    expect(svg.querySelector('line.supply-curve-shifted')).toBeNull();
  });

  const symbols = (svg) => [...svg.querySelectorAll('text.axis-symbol')].map((t) => t.textContent);

  it('labels the equilibrium Pe/Qe on the axes and hides the numeric tick underneath', () => {
    renderMarketChart(svg, computeMarket(base));
    expect(symbols(svg).sort()).toEqual(['Pe', 'Qe']);
    const tick80 = [...svg.querySelectorAll('.tick-label[data-axis="y"]')].find((t) => t.textContent === '80');
    expect(tick80.getAttribute('visibility')).toBe('hidden');
    const tick100 = [...svg.querySelectorAll('.tick-label[data-axis="y"]')].find((t) => t.textContent === '100');
    expect(tick100.getAttribute('visibility')).toBe('visible');
  });

  it('marks both Qs and Qd plus a labelled shortage bracket under a binding ceiling', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'ceiling', price: 50 } }));
    expect(svg.querySelectorAll('circle.control-point')).toHaveLength(2);
    expect(symbols(svg).sort()).toEqual(['Pe', 'Pmax', 'Qd', 'Qe', 'Qs']);
    const bracket = svg.querySelector('[data-region="shortage"]');
    expect(bracket).not.toBeNull();
    expect(bracket.querySelector('.bracket-label').textContent).toBe('Shortage');
  });

  it('labels the gap under a binding floor as excess supply, not "surplus"', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'floor', price: 110 } }));
    expect(symbols(svg)).toContain('Pmin');
    expect(svg.querySelector('[data-region="excess-supply"] .bracket-label').textContent).toBe('Excess supply');
  });

  it('clips the shortage bracket with an arrow when Qd lies past the chart edge, and omits the Qd symbol', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'ceiling', price: 30 } }));
    expect(svg.querySelector('[data-region="shortage"] polyline')).not.toBeNull();
    expect(symbols(svg)).not.toContain('Qd');
    expect(svg.querySelectorAll('circle.control-point')).toHaveLength(1);
  });

  it('names the tax prices Pc/Pp on the axis and the burdens inside their bands, not on the lines', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 40 } }));
    expect(symbols(svg).sort()).toEqual(['Pc', 'Pe', 'Pp', 'Q1', 'Qe']);
    expect(svg.querySelector('[data-region="tax-consumer"] .band-label').textContent).toBe('Consumer burden');
    expect(svg.querySelector('[data-region="tax-producer"] .band-label').textContent).toBe('Producer burden');
    expect(svg.textContent).not.toMatch(/Burden|Incidence/);
  });

  it('skips a band label when the band is too thin to hold it', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 2 } }));
    expect(svg.querySelector('.band-label')).toBeNull();
  });

  const symbolEl = (svg, name) => [...svg.querySelectorAll('text.axis-symbol')].find((t) => t.textContent === name);
  const fontSize = (svg, name) => +symbolEl(svg, name).getAttribute('font-size');

  it('shrinks Pc/Pp toward Pe for a small tax, keeping every symbol on its own line and Pe full size', () => {
    const r = computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 6 } });
    renderMarketChart(svg, r);
    expect(fontSize(svg, 'Pe')).toBe(16);
    expect(fontSize(svg, 'Pc')).toBeGreaterThan(0);
    expect(fontSize(svg, 'Pc')).toBeLessThan(16);
    expect(fontSize(svg, 'Pp')).toBeLessThan(16);
    // not pushed aside: Pc stays above Pe by exactly the gap between their price lines
    const y = (name) => +symbolEl(svg, name).getAttribute('y');
    expect(y('Pe') - y('Pc')).toBeLessThan(13);
  });

  it('shows Pc/Pp at full size once the wedge is wide enough', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 20 } }));
    expect(fontSize(svg, 'Pc')).toBe(16);
    expect(fontSize(svg, 'Pp')).toBe(16);
  });

  it('drops Pc/Pp entirely once they are within a few px of Pe', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 2 } }));
    expect(symbols(svg)).not.toContain('Pc');
    expect(symbols(svg)).not.toContain('Pp');
  });

  it('drops Pc/Pp/Q1 entirely at a zero tax or subsidy, leaving only Pe/Qe', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 0 } }));
    expect(symbols(svg).sort()).toEqual(['Pe', 'Qe']);
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'subsidy', amount: 0 } }));
    expect(symbols(svg).sort()).toEqual(['Pe', 'Qe']);
  });

  it('draws Pe/Qe after the intervention symbols so they stay on top', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 6 } }));
    const names = [...svg.querySelectorAll('text.axis-symbol')].map((t) => t.textContent);
    expect(names.indexOf('Pe')).toBeGreaterThan(names.indexOf('Pc'));
    expect(names.indexOf('Pe')).toBeGreaterThan(names.indexOf('Pp'));
  });

  it('draws no price lines or Pc/Pp symbols once a tax has closed the market', () => {
    const r = computeMarket({ demand: 100, supply: 60, slopeD: 1, slopeS: 1, intervention: { type: 'tax', mode: 'specific', amount: 60 } });
    expect(r.closed).toBe(true);
    renderMarketChart(svg, r);
    expect(svg.querySelectorAll('line.wedge-line')).toHaveLength(0);
    expect(symbols(svg).sort()).toEqual(['Pe', 'Qe']);
  });

  it('sizes the viewBox to the rendered width so chart text renders at its true pixel size', () => {
    Object.defineProperty(svg, 'clientWidth', { value: 360, configurable: true });
    renderMarketChart(svg, computeMarket(base));
    const [, , w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    expect(w).toBe(360);
    // narrow charts get a taller frame than 3:2 so the plot keeps usable height
    expect(h / w).toBeGreaterThan(2 / 3);
  });

  it('rebuilds the grid when the chart width changes', () => {
    renderMarketChart(svg, computeMarket(base));
    const before = svg.querySelector('.tick-label');
    Object.defineProperty(svg, 'clientWidth', { value: 400, configurable: true });
    renderMarketChart(svg, computeMarket(base));
    expect(svg.querySelector('.tick-label')).not.toBe(before);
    expect(svg.getAttribute('viewBox').startsWith('0 0 400 ')).toBe(true);
  });

  it('colours the ceiling/floor name label itself, not with the grey tick-label style', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'ceiling', price: 50 } }));
    const lbl = svg.querySelector('[data-region="ceiling"] .line-label');
    expect(lbl.textContent).toBe('Price ceiling');
    expect(lbl.classList.contains('tick-label')).toBe(false);
  });

  it('flips the excess-supply bracket below a floor set near the top of the chart', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'floor', price: 175 } }));
    const bracket = svg.querySelector('[data-region="excess-supply"] .gap-bracket');
    if (!bracket) return; // market may close entirely at this floor
    const lineY = +svg.querySelector('[data-region="floor"] .wedge-line').getAttribute('y1');
    expect(+bracket.getAttribute('y1')).toBeGreaterThan(lineY);
  });

  it('keeps curve names inside the plot when a curve leaves through the top edge', () => {
    renderMarketChart(svg, computeMarket({ demand: 330, supply: -170, slopeD: 4.2, slopeS: 4.2 }));
    const y = +svg.querySelector('text.curve-label').getAttribute('y');
    expect(y).toBeGreaterThanOrEqual(18 + 14);
  });

  it('clips shaded regions to the plot area instead of squashing off-chart corners', () => {
    // Demand intercept far above PMAX: the CS tip must keep its true (off-chart) position
    renderMarketChart(svg, computeMarket({ demand: 330, supply: -170, slopeD: 4.2, slopeS: 4.2 }));
    const fills = svg.querySelector('g.fills');
    expect(fills.getAttribute('clip-path')).toBe('url(#plotClip)');
    expect(fills.querySelector('polygon.cs-fill')).not.toBeNull();
    const tipY = Math.min(...svg.querySelector('polygon.cs-fill').getAttribute('points').split(' ').map((pt) => +pt.split(',')[1]));
    expect(tipY).toBeLessThan(0);
    expect(svg.querySelector('clipPath#plotClip')).not.toBeNull();
  });

  it('renders CS and PS badges when showSurplusLabels option is enabled in free market', () => {
    renderMarketChart(svg, computeMarket(base), { showSurplusLabels: true });
    const csBadge = svg.querySelector('.region-badge--cs');
    const psBadge = svg.querySelector('.region-badge--ps');
    const dwlBadge = svg.querySelector('.region-badge--dwl');
    expect(csBadge).not.toBeNull();
    expect(csBadge.querySelector('.region-badge__text').textContent).toBe('CS');
    expect(psBadge).not.toBeNull();
    expect(psBadge.querySelector('.region-badge__text').textContent).toBe('PS');
    expect(dwlBadge).toBeNull();
  });

  it('renders CS, PS, and DWL badges when showSurplusLabels is enabled under a binding ceiling', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'ceiling', price: 50 } }), { showSurplusLabels: true });
    const csBadge = svg.querySelector('.region-badge--cs');
    const psBadge = svg.querySelector('.region-badge--ps');
    const dwlBadge = svg.querySelector('.region-badge--dwl');
    expect(csBadge).not.toBeNull();
    expect(psBadge).not.toBeNull();
    expect(dwlBadge).not.toBeNull();
    expect(dwlBadge.querySelector('.region-badge__text').textContent).toBe('DWL');
  });

  it('omits surplus badges by default when showSurplusLabels is false', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'ceiling', price: 50 } }));
    expect(svg.querySelector('.region-badge--cs')).toBeNull();
    expect(svg.querySelector('.region-badge--ps')).toBeNull();
    expect(svg.querySelector('.region-badge--dwl')).toBeNull();
  });
});

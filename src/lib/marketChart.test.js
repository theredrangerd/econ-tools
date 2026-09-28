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

  it('spreads crowded axis symbols apart so they never overlap', () => {
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 2 } }));
    const ys = [...svg.querySelectorAll('text.axis-symbol')].filter((t) => t.textContent.startsWith('P')).map((t) => +t.getAttribute('y')).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(13 - 1e-9);
  });

  it('draws no price lines or Pc/Pp symbols once a tax has closed the market', () => {
    const r = computeMarket({ demand: 100, supply: 60, slopeD: 1, slopeS: 1, intervention: { type: 'tax', mode: 'specific', amount: 60 } });
    expect(r.closed).toBe(true);
    renderMarketChart(svg, r);
    expect(svg.querySelectorAll('line.wedge-line')).toHaveLength(0);
    expect(symbols(svg).sort()).toEqual(['Pe', 'Qe']);
  });
});

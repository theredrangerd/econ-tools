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
});

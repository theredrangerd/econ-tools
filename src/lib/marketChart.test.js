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

  it('draws two wedge reference lines and a revenue rectangle for a tax', () => {
    const result = computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 20 } });
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.wedge-line')).toHaveLength(2);
    expect(svg.querySelector('polygon.wedge-fill')).not.toBeNull();
  });

  it('draws a single reference line for a binding price floor', () => {
    const result = computeMarket({ ...base, intervention: { type: 'floor', price: 110 } });
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.wedge-line')).toHaveLength(1);
    expect(svg.querySelector('polygon.wedge-fill')).toBeNull();
  });

  it('clears previously drawn content on re-render, so dragging a slider does not accumulate elements', () => {
    const result = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, result);
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.demand-curve')).toHaveLength(1);
  });
});

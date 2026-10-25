import { describe, it, expect } from 'vitest';
import { REGION_INFO, attachRegionExplainers } from './regionExplainers.js';
import { computeMarket } from './marketEngine.js';
import { renderMarketChart } from './marketChart.js';

describe('REGION_INFO wording', () => {
  it('does not equate too little trade with a shortage (a tax or floor causes no shortage)', () => {
    expect(REGION_INFO.dwl.text).not.toMatch(/shortage/i);
    expect(REGION_INFO.dwl.text).toMatch(/tax/);
  });

  it('places the floor gap at the floor price and calls it excess supply', () => {
    expect(REGION_INFO.floor.text).not.toMatch(/below it/);
    expect(REGION_INFO.floor.text).toMatch(/excess supply/);
    expect(REGION_INFO.ceiling.text).not.toMatch(/below it/);
  });

  it('explains the shortage and excess-supply brackets', () => {
    expect(REGION_INFO.shortage.text).toMatch(/Qd − Qs/);
    expect(REGION_INFO['excess-supply'].text).toMatch(/not the same thing as producer surplus/);
  });
});

describe('attachRegionExplainers at every detail level', () => {
  const base = { demand: 140, supply: 20, slopeD: 1, slopeS: 1 };
  let svg;

  function setup(detail) {
    document.body.innerHTML = '';
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'market-chart');
    document.body.appendChild(svg);
    renderMarketChart(svg, computeMarket({ ...base, intervention: { type: 'ceiling', price: 50 } }), { showSurplusLabels: true, detail });
    return attachRegionExplainers(svg);
  }
  const clickCs = () => svg.querySelector('[data-region="cs"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));

  it.each(['clean', 'ib'])('still opens an explainer at %s', (detail) => {
    setup(detail);
    clickCs();
    expect(document.querySelector('.region-popover')).not.toBeNull();
  });

  it('opens an explainer at full and close() removes it', () => {
    const explainers = setup('full');
    clickCs();
    expect(document.querySelector('.region-popover')).not.toBeNull();
    explainers.close();
    expect(document.querySelector('.region-popover')).toBeNull();
    expect(svg.querySelector('.region-active')).toBeNull();
  });
});

describe('explainer context notes', () => {
  const base = { demand: 140, supply: 20, slopeD: 1, slopeS: 1 };

  // Opens every clickable region in turn and returns each popover's text.
  function allPopoverText(intervention) {
    document.body.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'market-chart');
    document.body.appendChild(svg);
    renderMarketChart(svg, computeMarket({ ...base, intervention }), { showSurplusLabels: true });
    const explainers = attachRegionExplainers(svg);
    const keys = [...new Set([...svg.querySelectorAll('[data-region]')].map((n) => n.dataset.region))];
    return keys.map((key) => {
      svg.querySelector(`[data-region="${key}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const text = document.querySelector('.region-popover')?.textContent ?? '';
      explainers.close();
      return text;
    });
  }

  it.each([
    ['a binding ceiling', { type: 'ceiling', price: 50 }],
    ['the free market', { type: 'none' }],
  ])('prints prices with a single dollar sign and no raw symbols under %s', (_, intervention) => {
    const texts = allPopoverText(intervention);
    expect(texts.some((t) => /\$\d/.test(t))).toBe(true);
    for (const t of texts) {
      expect(t).not.toContain('$$');
      expect(t).not.toContain('P_e');
    }
  });
});

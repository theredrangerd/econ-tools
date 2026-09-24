import { describe, it, expect, beforeEach } from 'vitest';
import { initPriceFloorPage } from './price-floor.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="mini-header"></div>
    <svg id="chart" class="market-chart"></svg>
    <span id="status-pill"></span>
    <input id="demand-slider" type="range" min="70" max="170" step="1" value="140">
    <span id="demand-val"></span>
    <input id="supply-slider" type="range" min="-10" max="110" step="1" value="20">
    <span id="supply-val"></span>
    <input id="floor-toggle" type="checkbox">
    <input id="floor-slider" type="range" min="0" max="180" step="1" value="110">
    <span id="floor-val"></span>
    <button id="reset-btn" type="button"></button>
    <span id="stat-price"></span>
    <span id="stat-qty"></span>
    <span id="stat-cs"></span>
    <span id="stat-ps"></span>
    <span id="stat-dwl"></span>
    <div id="market-note"></div>
  `;
}

describe('initPriceFloorPage', () => {
  beforeEach(() => {
    buildDom();
    initPriceFloorPage(document);
  });

  it('renders the free-market baseline stats with the floor toggled off', () => {
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
    expect(document.querySelector('#stat-dwl').textContent).toBe('$0');
  });

  it('shows the binding-floor stats once the toggle is switched on', () => {
    document.querySelector('#floor-toggle').checked = true;
    document.querySelector('#floor-toggle').dispatchEvent(new Event('change'));
    expect(document.querySelector('#stat-price').textContent).toBe('$110.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('30.0');
    expect(document.querySelector('#stat-dwl').textContent).toBe('$900');
    expect(document.querySelector('#status-pill').textContent).toBe('Price floor binding');
  });

  it('resets sliders and toggle to their defaults on reset', () => {
    document.querySelector('#floor-toggle').checked = true;
    document.querySelector('#floor-toggle').dispatchEvent(new Event('change'));
    document.querySelector('#reset-btn').click();
    expect(document.querySelector('#floor-toggle').checked).toBe(false);
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
  });
});

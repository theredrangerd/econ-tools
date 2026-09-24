import { describe, it, expect, beforeEach } from 'vitest';
import { initSubsidyPage } from './subsidy.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="mini-header"></div>
    <svg id="chart" class="market-chart"></svg>
    <span id="status-pill"></span>
    <input id="demand-slider" type="range" min="70" max="170" step="1" value="140">
    <span id="demand-val"></span>
    <input id="supply-slider" type="range" min="-10" max="110" step="1" value="20">
    <span id="supply-val"></span>
    <input id="subsidy-slider" type="range" min="0" max="60" step="1" value="20">
    <span id="subsidy-val"></span>
    <button id="reset-btn" type="button"></button>
    <span id="stat-price-consumer"></span>
    <span id="stat-price-producer"></span>
    <span id="stat-qty"></span>
    <span id="stat-cost"></span>
    <span id="stat-dwl"></span>
    <div id="market-note"></div>
  `;
}

describe('initSubsidyPage', () => {
  beforeEach(() => {
    buildDom();
    initSubsidyPage(document);
  });

  it('shows the default subsidy outcome', () => {
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$70.00');
    expect(document.querySelector('#stat-price-producer').textContent).toBe('$90.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('70.0');
    expect(document.querySelector('#stat-cost').textContent).toBe('$1,400');
  });

  it('updates the outcome when the subsidy amount slider changes', () => {
    document.querySelector('#subsidy-slider').value = '0';
    document.querySelector('#subsidy-slider').dispatchEvent(new Event('input'));
    expect(document.querySelector('#stat-qty').textContent).toBe('60.0');
    expect(document.querySelector('#stat-cost').textContent).toBe('$0');
  });

  it('draws a wedge fill rectangle for the government cost', () => {
    expect(document.querySelector('#chart polygon.wedge-fill')).not.toBeNull();
  });
});

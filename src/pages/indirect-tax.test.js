import { describe, it, expect, beforeEach } from 'vitest';
import { initIndirectTaxPage } from './indirect-tax.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="mini-header"></div>
    <div id="family-nav"></div>
    <svg id="chart" class="market-chart"></svg>
    <span id="status-pill"></span>
    <input id="demand-slider" type="range" min="70" max="170" step="1" value="140">
    <span id="demand-val"></span>
    <input id="supply-slider" type="range" min="-10" max="110" step="1" value="20">
    <span id="supply-val"></span>
    <input id="slope-d-slider" type="range" min="0.3" max="3" step="0.1" value="1">
    <span id="slope-d-val"></span>
    <input id="slope-s-slider" type="range" min="0.3" max="3" step="0.1" value="1">
    <span id="slope-s-val"></span>
    <input type="radio" name="tax-mode" id="tax-mode-specific" value="specific" checked>
    <input type="radio" name="tax-mode" id="tax-mode-advalorem" value="advalorem">
    <div class="sub-slider open" id="specific-slider-wrap">
      <input id="specific-slider" type="range" min="0" max="60" step="1" value="20">
      <span id="specific-val"></span>
    </div>
    <div class="sub-slider" id="advalorem-slider-wrap">
      <input id="advalorem-slider" type="range" min="0" max="100" step="1" value="50">
      <span id="advalorem-val"></span>
    </div>
    <button id="reset-btn" type="button"></button>
    <span id="stat-price-consumer"></span>
    <span id="stat-price-producer"></span>
    <span id="stat-qty"></span>
    <span id="stat-cs"></span>
    <span id="stat-ps"></span>
    <span id="stat-revenue"></span>
    <span id="stat-dwl"></span>
    <div id="market-note"></div>
  `;
}

describe('initIndirectTaxPage', () => {
  beforeEach(() => {
    buildDom();
    initIndirectTaxPage(document);
  });

  it('shows the specific-tax outcome by default', () => {
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$90.00');
    expect(document.querySelector('#stat-price-producer').textContent).toBe('$70.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('50.0');
    expect(document.querySelector('#stat-revenue').textContent).toBe('$1,000');
  });

  it('switches to the ad valorem outcome when that mode is selected', () => {
    document.querySelector('#tax-mode-advalorem').checked = true;
    document.querySelector('#tax-mode-advalorem').dispatchEvent(new Event('change'));
    expect(document.querySelector('#stat-price-producer').textContent).toBe('$64.00');
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$96.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('44.0');
    expect(document.querySelector('#stat-revenue').textContent).toBe('$1,408');
  });

  it('draws two wedge reference lines on the chart', () => {
    expect(document.querySelectorAll('#chart line.wedge-line')).toHaveLength(2);
  });

  it('toggles slider visibility based on tax mode', () => {
    expect(document.querySelector('#specific-slider-wrap').classList.contains('open')).toBe(true);
    expect(document.querySelector('#advalorem-slider-wrap').classList.contains('open')).toBe(false);

    document.querySelector('#tax-mode-advalorem').checked = true;
    document.querySelector('#tax-mode-advalorem').dispatchEvent(new Event('change'));

    expect(document.querySelector('#specific-slider-wrap').classList.contains('open')).toBe(false);
    expect(document.querySelector('#advalorem-slider-wrap').classList.contains('open')).toBe(true);
  });

  it('changes the computed outcome when demand elasticity is adjusted away from 1', () => {
    document.querySelector('#slope-d-slider').value = '2';
    document.querySelector('#slope-d-slider').dispatchEvent(new Event('input'));
    expect(document.querySelector('#stat-price-consumer').textContent).not.toBe('$90.00');
  });

  it('shows consumer and producer surplus stats alongside tax revenue', () => {
    expect(document.querySelector('#stat-cs').textContent).not.toBe('');
    expect(document.querySelector('#stat-ps').textContent).not.toBe('');
  });

  it('renders a family nav back link to the Government Intervention family page', () => {
    const back = document.querySelector('#family-nav a.family-nav__back');
    expect(back).not.toBeNull();
    expect(back.getAttribute('href')).toBe('/units/microeconomics/government-intervention.html');
  });
});

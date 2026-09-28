import { describe, it, expect, beforeEach } from 'vitest';
import { initSubsidyPage } from './subsidy.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="mini-header"></div>
    <svg id="chart" class="market-chart"></svg>
    <span id="status-pill"></span>
    <input id="demand-slider" type="range" min="-50" max="50" step="1" value="0">
    <span id="demand-val"></span>
    <input id="supply-slider" type="range" min="-50" max="50" step="1" value="0">
    <span id="supply-val"></span>
    <input id="slope-d-slider" type="range" min="-0.5" max="0.5" step="0.05" value="0">
    <span id="slope-d-val"></span>
    <input id="slope-s-slider" type="range" min="-0.5" max="0.5" step="0.05" value="0">
    <span id="slope-s-val"></span>
    <input id="subsidy-toggle" type="checkbox">
    <input id="subsidy-slider" type="range" min="0" max="60" step="1" value="20">
    <span id="subsidy-val"></span>
    <span id="stat-price-consumer"></span>
    <span id="stat-price-producer"></span>
    <span id="stat-qty"></span>
    <span id="stat-cs"></span>
    <span id="stat-ps"></span>
    <span id="stat-cost"></span>
    <span id="stat-incidence-consumer"></span>
    <span id="stat-incidence-producer"></span>
    <span id="stat-dwl"></span>
    <div id="market-note"></div>
    <iframe id="feedback-form"></iframe>
  `;
}

describe('initSubsidyPage', () => {
  beforeEach(() => {
    buildDom();
    initSubsidyPage(document);
  });

  it('renders the free-market baseline stats with the subsidy toggled off', () => {
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$80.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('60.0');
    expect(document.querySelector('#stat-cost').textContent).toBe('$0');
    expect(document.querySelector('#status-pill').textContent).toBe('Free market');
  });

  it('shows the subsidy outcome once the toggle is switched on', () => {
    document.querySelector('#subsidy-toggle').checked = true;
    document.querySelector('#subsidy-toggle').dispatchEvent(new Event('change'));
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$70.00');
    expect(document.querySelector('#stat-price-producer').textContent).toBe('$90.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('67.5');
    expect(document.querySelector('#stat-cost').textContent).toBe('$1,350');
    expect(document.querySelector('#status-pill').textContent).toBe('Subsidy applied');
  });

  it('updates the outcome when the subsidy amount slider changes', () => {
    document.querySelector('#subsidy-toggle').checked = true;
    document.querySelector('#subsidy-toggle').dispatchEvent(new Event('change'));
    document.querySelector('#subsidy-slider').value = '40';
    document.querySelector('#subsidy-slider').dispatchEvent(new Event('input'));
    expect(document.querySelector('#stat-qty').textContent).not.toBe('67.5');
  });

  it('draws a wedge fill rectangle for the government cost once toggled on', () => {
    document.querySelector('#subsidy-toggle').checked = true;
    document.querySelector('#subsidy-toggle').dispatchEvent(new Event('change'));
    expect(document.querySelector('#chart polygon.wedge-fill')).not.toBeNull();
  });

  it('shows the true point elasticity at equilibrium, rising as the elasticity slider is dragged right (flatter)', () => {
    expect(document.querySelector('#slope-d-val').textContent).toBe('1.00 · unit elastic');
    document.querySelector('#slope-d-slider').value = '0.5';
    document.querySelector('#slope-d-slider').dispatchEvent(new Event('input'));
    expect(document.querySelector('#slope-d-val').textContent).toBe('3.16 · elastic');
    document.querySelector('#slope-d-slider').value = '-0.5';
    document.querySelector('#slope-d-slider').dispatchEvent(new Event('input'));
    expect(document.querySelector('#slope-d-val').textContent).toBe('0.32 · inelastic');
  });

  it('shows a supply readout that rises as the slider is dragged right toward more supply', () => {
    document.querySelector('#supply-slider').value = '10';
    document.querySelector('#supply-slider').dispatchEvent(new Event('input'));
    expect(document.querySelector('#supply-val').textContent).toBe('+10');
    expect(document.querySelector('#stat-qty').textContent).toBe('63.8');
  });

  it('stops the elasticity sliders before the subsidised quantity runs off the chart', () => {
    document.querySelector('#subsidy-toggle').checked = true;
    document.querySelector('#subsidy-toggle').dispatchEvent(new Event('change'));
    document.querySelector('#subsidy-slider').value = '60';
    document.querySelector('#subsidy-slider').dispatchEvent(new Event('input'));
    document.querySelector('#slope-d-slider').value = '0.5';
    document.querySelector('#slope-d-slider').dispatchEvent(new Event('input'));
    document.querySelector('#slope-s-slider').value = '0.5';
    document.querySelector('#slope-s-slider').dispatchEvent(new Event('input'));
    expect(+document.querySelector('#stat-qty').textContent).toBeLessThanOrEqual(100);
    expect(+document.querySelector('#slope-s-slider').value).toBeLessThan(0.5);
  });

  it('pulls the subsidy back into range when switched on with flat curves', () => {
    document.querySelector('#slope-d-slider').value = '0.5';
    document.querySelector('#slope-d-slider').dispatchEvent(new Event('input'));
    document.querySelector('#slope-s-slider').value = '0.5';
    document.querySelector('#slope-s-slider').dispatchEvent(new Event('input'));
    document.querySelector('#subsidy-slider').value = '60';
    document.querySelector('#subsidy-slider').dispatchEvent(new Event('input'));
    document.querySelector('#subsidy-toggle').checked = true;
    document.querySelector('#subsidy-toggle').dispatchEvent(new Event('change'));
    expect(document.querySelector('#subsidy-val').textContent).toBe('$33');
    expect(+document.querySelector('#stat-qty').textContent).toBeLessThanOrEqual(100);
  });

  it('shows consumer and producer surplus stats alongside government cost', () => {
    expect(document.querySelector('#stat-cs').textContent).not.toBe('');
    expect(document.querySelector('#stat-ps').textContent).not.toBe('');
  });

  it('renders a mini-header back link to the Government Intervention family page', () => {
    const back = document.querySelector('#mini-header a.mini-header__back');
    expect(back).not.toBeNull();
    expect(back.getAttribute('href')).toBe('/units/microeconomics/government-intervention.html');
  });

  it('renders sibling diagram links (excluding itself) in the mini-header', () => {
    const links = document.querySelectorAll('#mini-header .mini-header__siblings a');
    expect(links.length).toBeGreaterThan(0);
    expect([...links].some((a) => a.textContent === 'Subsidy')).toBe(false);
    expect([...links].some((a) => a.textContent === 'Indirect tax')).toBe(true);
  });
});

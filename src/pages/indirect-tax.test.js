import { describe, it, expect, beforeEach } from 'vitest';
import { initIndirectTaxPage } from './indirect-tax.js';

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
    <input id="tax-toggle" type="checkbox">
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
    <span id="stat-price-consumer"></span>
    <span id="stat-price-producer"></span>
    <span id="stat-qty"></span>
    <span id="stat-cs"></span>
    <span id="stat-ps"></span>
    <span id="stat-revenue"></span>
    <span id="stat-incidence-consumer"></span>
    <span id="stat-incidence-producer"></span>
    <span id="stat-dwl"></span>
    <div id="market-note"></div>
  `;
}

describe('initIndirectTaxPage', () => {
  beforeEach(() => {
    buildDom();
    initIndirectTaxPage(document);
  });

  it('renders the free-market baseline stats with the tax toggled off', () => {
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$80.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('60.0');
    expect(document.querySelector('#stat-revenue').textContent).toBe('$0');
    expect(document.querySelector('#status-pill').textContent).toBe('Free market');
  });

  it('shows the specific-tax outcome once the toggle is switched on', () => {
    document.querySelector('#tax-toggle').checked = true;
    document.querySelector('#tax-toggle').dispatchEvent(new Event('change'));
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$90.00');
    expect(document.querySelector('#stat-price-producer').textContent).toBe('$70.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('50.0');
    expect(document.querySelector('#stat-revenue').textContent).toBe('$1,000');
    expect(document.querySelector('#status-pill').textContent).toBe('Tax applied');
  });

  it('switches to the ad valorem outcome when that mode is selected', () => {
    document.querySelector('#tax-toggle').checked = true;
    document.querySelector('#tax-toggle').dispatchEvent(new Event('change'));
    document.querySelector('#tax-mode-advalorem').checked = true;
    document.querySelector('#tax-mode-advalorem').dispatchEvent(new Event('change'));
    expect(document.querySelector('#stat-price-producer').textContent).toBe('$64.00');
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$96.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('44.0');
    expect(document.querySelector('#stat-revenue').textContent).toBe('$1,408');
  });

  it('draws two wedge reference lines on the chart once the tax is toggled on', () => {
    document.querySelector('#tax-toggle').checked = true;
    document.querySelector('#tax-toggle').dispatchEvent(new Event('change'));
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

  it('shows the true point elasticity at equilibrium, rising as the elasticity slider is dragged right (flatter)', () => {
    expect(document.querySelector('#slope-d-val').textContent).toBe('1.33 · elastic');
    document.querySelector('#slope-d-slider').value = '0.5';
    document.querySelector('#slope-d-slider').dispatchEvent(new Event('input'));
    expect(document.querySelector('#slope-d-val').textContent).toBe('4.22 · elastic');
    document.querySelector('#slope-d-slider').value = '-0.5';
    document.querySelector('#slope-d-slider').dispatchEvent(new Event('input'));
    expect(document.querySelector('#slope-d-val').textContent).toBe('0.42 · inelastic');
  });

  it('shows a supply readout that rises as the slider is dragged right toward more supply', () => {
    document.querySelector('#supply-slider').value = '10';
    document.querySelector('#supply-slider').dispatchEvent(new Event('input'));
    expect(document.querySelector('#supply-val').textContent).toBe('+10');
    expect(document.querySelector('#stat-qty').textContent).toBe('65.0');
  });

  it('shifts the tax burden toward producers when demand is made more elastic', () => {
    document.querySelector('#tax-toggle').checked = true;
    document.querySelector('#tax-toggle').dispatchEvent(new Event('change'));
    document.querySelector('#slope-d-slider').value = '0.5';
    document.querySelector('#slope-d-slider').dispatchEvent(new Event('input'));
    const money = (id) => +document.querySelector(id).textContent.replace(/[$,]/g, '');
    expect(money('#stat-incidence-consumer')).toBeLessThan(money('#stat-incidence-producer'));
  });

  it('describes the lost trades using the correct price bands', () => {
    document.querySelector('#tax-toggle').checked = true;
    document.querySelector('#tax-toggle').dispatchEvent(new Event('change'));
    const note = document.querySelector('#market-note').textContent;
    expect(note).toContain('$100 of surplus is lost.');
    expect(note).toContain('10.0 fewer units are traded');
    expect(note).toContain('$80–$90');
    expect(note).toContain('$70–$80');
    expect(note).toContain('$20 tax');
  });

  it('shows consumer and producer surplus stats alongside tax revenue', () => {
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
    expect([...links].some((a) => a.textContent === 'Indirect tax')).toBe(false);
    expect([...links].some((a) => a.textContent === 'Subsidy')).toBe(true);
  });

  it('reports no prices and explains why once the tax closes the market', () => {
    document.querySelector('#tax-toggle').checked = true;
    document.querySelector('#tax-toggle').dispatchEvent(new Event('change'));
    for (const [id, v] of [['#demand-slider', '-40'], ['#supply-slider', '-30'], ['#specific-slider', '60']]) {
      document.querySelector(id).value = v;
      document.querySelector(id).dispatchEvent(new Event('input'));
    }
    expect(document.querySelector('#stat-qty').textContent).toBe('0.0');
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('—');
    expect(document.querySelector('#stat-price-producer').textContent).toBe('—');
    expect(document.querySelector('#market-note').textContent).toContain('No units are traded');
  });
});

import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty } from '../lib/format.js';
import { getUnits, familyHref, diagramHref } from '../lib/units.js';
import { renderFamilyNav } from '../components/familyNav.js';

function elasticityLabel(slope) {
  if (slope < 0.5) return 'very elastic';
  if (slope < 0.85) return 'elastic';
  if (slope <= 1.15) return 'unit elastic';
  if (slope < 2) return 'inelastic';
  return 'very inelastic';
}

const DEFAULTS = { demand: 140, supply: 20, slopeD: 1, slopeS: 1, mode: 'specific', specificAmount: 20, advaloremRate: 50 };

export function initIndirectTaxPage(doc) {
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Indirect tax' });

  const unit = getUnits().find((u) => u.slug === 'microeconomics');
  const family = unit.families.find((f) => f.slug === 'government-intervention');
  renderFamilyNav(doc.querySelector('#family-nav'), {
    familyName: family.name,
    familyHref: familyHref(unit, family),
    siblings: family.diagrams.map((d) => ({
      name: d.name,
      href: diagramHref(unit, family, d),
      current: d.slug === 'indirect-tax',
    })),
  });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const slopeDSlider = doc.querySelector('#slope-d-slider');
  const slopeSSlider = doc.querySelector('#slope-s-slider');
  const modeSpecific = doc.querySelector('#tax-mode-specific');
  const modeAdvalorem = doc.querySelector('#tax-mode-advalorem');
  const specificSlider = doc.querySelector('#specific-slider');
  const advaloremSlider = doc.querySelector('#advalorem-slider');
  const specificSliderWrap = doc.querySelector('#specific-slider-wrap');
  const advaloremSliderWrap = doc.querySelector('#advalorem-slider-wrap');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const slopeD = +slopeDSlider.value;
    const slopeS = +slopeSSlider.value;
    const mode = modeAdvalorem.checked ? 'advalorem' : 'specific';

    specificSliderWrap.classList.toggle('open', mode === 'specific');
    advaloremSliderWrap.classList.toggle('open', mode === 'advalorem');

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#slope-d-val').textContent = slopeD.toFixed(1) + ' · ' + elasticityLabel(slopeD);
    doc.querySelector('#slope-s-val').textContent = slopeS.toFixed(1) + ' · ' + elasticityLabel(slopeS);
    doc.querySelector('#specific-val').textContent = '$' + specificSlider.value;
    doc.querySelector('#advalorem-val').textContent = advaloremSlider.value + '%';

    const intervention = mode === 'advalorem'
      ? { type: 'tax', mode: 'advalorem', rate: (+advaloremSlider.value) / 100 }
      : { type: 'tax', mode: 'specific', amount: +specificSlider.value };

    const result = computeMarket({ demand, supply, slopeD, slopeS, intervention });

    renderMarketChart(chart, result);

    doc.querySelector('#status-pill').textContent = 'Tax applied';
    doc.querySelector('#stat-price-consumer').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-price-producer').textContent = result.noTrade ? '—' : fmtPrice(result.Pp);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-cs').textContent = result.noTrade ? '$0' : fmtMoney(result.CS);
    doc.querySelector('#stat-ps').textContent = result.noTrade ? '$0' : fmtMoney(result.PS);
    doc.querySelector('#stat-revenue').textContent = result.noTrade ? '$0' : fmtMoney(result.govRevenue);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    doc.querySelector('#market-note').innerHTML = result.noTrade
      ? '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.'
      : `<strong>${fmtMoney(result.DWL)} of surplus is lost.</strong> The tax wedge stops mutually beneficial trades between consumers who value the good above $${result.Pp.toFixed(0)} and sellers who would supply it below $${result.Pc.toFixed(0)}.`;
  }

  [demandSlider, supplySlider, slopeDSlider, slopeSSlider, specificSlider, advaloremSlider].forEach((input) => input.addEventListener('input', render));
  [modeSpecific, modeAdvalorem].forEach((input) => input.addEventListener('change', render));

  doc.querySelector('#reset-btn').addEventListener('click', () => {
    demandSlider.value = DEFAULTS.demand;
    supplySlider.value = DEFAULTS.supply;
    slopeDSlider.value = DEFAULTS.slopeD;
    slopeSSlider.value = DEFAULTS.slopeS;
    modeSpecific.checked = true;
    modeAdvalorem.checked = false;
    specificSlider.value = DEFAULTS.specificAmount;
    advaloremSlider.value = DEFAULTS.advaloremRate;
    render();
  });

  render();
}

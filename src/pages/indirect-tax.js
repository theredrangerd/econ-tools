import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty } from '../lib/format.js';

const DEFAULTS = { demand: 140, supply: 20, mode: 'specific', specificAmount: 20, advaloremRate: 50 };

export function initIndirectTaxPage(doc) {
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Indirect tax' });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const modeSpecific = doc.querySelector('#tax-mode-specific');
  const modeAdvalorem = doc.querySelector('#tax-mode-advalorem');
  const specificSlider = doc.querySelector('#specific-slider');
  const advaloremSlider = doc.querySelector('#advalorem-slider');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const mode = modeAdvalorem.checked ? 'advalorem' : 'specific';

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#specific-val').textContent = '$' + specificSlider.value;
    doc.querySelector('#advalorem-val').textContent = advaloremSlider.value + '%';

    const intervention = mode === 'advalorem'
      ? { type: 'tax', mode: 'advalorem', rate: (+advaloremSlider.value) / 100 }
      : { type: 'tax', mode: 'specific', amount: +specificSlider.value };

    const result = computeMarket({ demand, supply, slopeD: 1, slopeS: 1, intervention });

    renderMarketChart(chart, result);

    doc.querySelector('#status-pill').textContent = 'Tax applied';
    doc.querySelector('#stat-price-consumer').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-price-producer').textContent = result.noTrade ? '—' : fmtPrice(result.Pp);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-revenue').textContent = result.noTrade ? '$0' : fmtMoney(result.govRevenue);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    doc.querySelector('#market-note').innerHTML = result.noTrade
      ? '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.'
      : `<strong>${fmtMoney(result.DWL)} of surplus is lost.</strong> The tax wedge stops mutually beneficial trades between consumers who value the good above $${result.Pp.toFixed(0)} and sellers who would supply it below $${result.Pc.toFixed(0)}.`;
  }

  [demandSlider, supplySlider, specificSlider, advaloremSlider].forEach((input) => input.addEventListener('input', render));
  [modeSpecific, modeAdvalorem].forEach((input) => input.addEventListener('change', render));

  doc.querySelector('#reset-btn').addEventListener('click', () => {
    demandSlider.value = DEFAULTS.demand;
    supplySlider.value = DEFAULTS.supply;
    modeSpecific.checked = true;
    modeAdvalorem.checked = false;
    specificSlider.value = DEFAULTS.specificAmount;
    advaloremSlider.value = DEFAULTS.advaloremRate;
    render();
  });

  render();
}

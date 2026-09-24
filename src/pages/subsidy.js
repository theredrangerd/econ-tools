import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty } from '../lib/format.js';

const DEFAULTS = { demand: 140, supply: 20, subsidyAmount: 20 };

export function initSubsidyPage(doc) {
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Subsidy' });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const subsidySlider = doc.querySelector('#subsidy-slider');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const amount = +subsidySlider.value;

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#subsidy-val').textContent = '$' + amount;

    const intervention = amount > 0 ? { type: 'subsidy', amount } : { type: 'none' };
    const result = computeMarket({ demand, supply, slopeD: 1, slopeS: 1, intervention });

    renderMarketChart(chart, result);

    doc.querySelector('#status-pill').textContent = amount > 0 ? 'Subsidy applied' : 'Free market';
    doc.querySelector('#stat-price-consumer').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-price-producer').textContent = result.noTrade ? '—' : fmtPrice(result.Pp);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-cost').textContent = result.noTrade ? '$0' : fmtMoney(result.govCost);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    doc.querySelector('#market-note').innerHTML = result.noTrade
      ? '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.'
      : amount > 0
        ? `<strong>${fmtMoney(result.DWL)} of welfare is lost.</strong> The subsidy pushes output past the efficient quantity — the last few units cost more to produce than buyers value them at.`
        : 'Equilibrium price and quantity — every mutually beneficial trade happens.';
  }

  [demandSlider, supplySlider, subsidySlider].forEach((input) => input.addEventListener('input', render));

  doc.querySelector('#reset-btn').addEventListener('click', () => {
    demandSlider.value = DEFAULTS.demand;
    supplySlider.value = DEFAULTS.supply;
    subsidySlider.value = DEFAULTS.subsidyAmount;
    render();
  });

  render();
}

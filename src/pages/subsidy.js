import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty, elasticityLabel, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';

export function initSubsidyPage(doc) {
  const { backHref, backLabel, siblings } = getFamilyNav('subsidy');
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Subsidy', backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const slopeDSlider = doc.querySelector('#slope-d-slider');
  const slopeSSlider = doc.querySelector('#slope-s-slider');
  const subsidySlider = doc.querySelector('#subsidy-slider');
  const subsidyToggle = doc.querySelector('#subsidy-toggle');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const slopeD = +slopeDSlider.value;
    const slopeS = +slopeSSlider.value;
    const subsidyOn = subsidyToggle.checked;
    const amount = +subsidySlider.value;

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#slope-d-val').textContent = slopeD.toFixed(1) + ' · ' + elasticityLabel(slopeD);
    doc.querySelector('#slope-s-val').textContent = slopeS.toFixed(1) + ' · ' + elasticityLabel(slopeS);
    doc.querySelector('#subsidy-val').textContent = '$' + amount;

    const intervention = subsidyOn ? { type: 'subsidy', amount } : { type: 'none' };
    const result = computeMarket({ demand, supply, slopeD, slopeS, intervention });

    renderMarketChart(chart, result);

    setStatusPill(doc.querySelector('#status-pill'), subsidyOn ? 'Subsidy applied' : 'Free market', result.mode);
    doc.querySelector('#stat-price-consumer').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-price-producer').textContent = result.noTrade ? '—' : fmtPrice(result.Pp);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-cs').textContent = result.noTrade ? '$0' : fmtMoney(result.CS);
    doc.querySelector('#stat-ps').textContent = result.noTrade ? '$0' : fmtMoney(result.PS);
    doc.querySelector('#stat-cost').textContent = result.noTrade ? '$0' : fmtMoney(result.govCost);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    doc.querySelector('#market-note').innerHTML = result.noTrade
      ? '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.'
      : subsidyOn
        ? `<strong>${fmtMoney(result.DWL)} of welfare is lost.</strong> The subsidy pushes output past the efficient quantity — the last few units cost more to produce than buyers value them at.`
        : '';
  }

  [demandSlider, supplySlider, slopeDSlider, slopeSSlider, subsidySlider].forEach((input) => input.addEventListener('input', render));
  subsidyToggle.addEventListener('change', render);

  render();
}

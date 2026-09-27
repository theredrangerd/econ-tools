import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty, elasticityLabel, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';

export function initPriceCeilingPage(doc) {
  const { backHref, backLabel, siblings } = getFamilyNav('price-ceiling');
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Price ceiling', backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const slopeDSlider = doc.querySelector('#slope-d-slider');
  const slopeSSlider = doc.querySelector('#slope-s-slider');
  const ceilingToggle = doc.querySelector('#ceiling-toggle');
  const ceilingSlider = doc.querySelector('#ceiling-slider');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const slopeD = +slopeDSlider.value;
    const slopeS = +slopeSSlider.value;
    const ceilingOn = ceilingToggle.checked;
    const ceilingPrice = +ceilingSlider.value;

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#slope-d-val').textContent = slopeD.toFixed(1) + ' · ' + elasticityLabel(slopeD);
    doc.querySelector('#slope-s-val').textContent = slopeS.toFixed(1) + ' · ' + elasticityLabel(slopeS);
    doc.querySelector('#ceiling-val').textContent = '$' + ceilingPrice;

    const intervention = ceilingOn ? { type: 'ceiling', price: ceilingPrice } : { type: 'none' };
    const result = computeMarket({ demand, supply, slopeD, slopeS, intervention });

    renderMarketChart(chart, result);

    setStatusPill(doc.querySelector('#status-pill'), result.mode === 'ceiling' ? 'Price ceiling binding' : 'Free market', result.mode);

    doc.querySelector('#stat-price').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-cs').textContent = result.noTrade ? '$0' : fmtMoney(result.CS);
    doc.querySelector('#stat-ps').textContent = result.noTrade ? '$0' : fmtMoney(result.PS);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    const note = doc.querySelector('#market-note');
    if (result.noTrade) {
      note.innerHTML = '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.';
    } else if (result.mode === 'ceiling') {
      note.innerHTML = `<strong>${fmtQty(result.gap)} units of shortage.</strong> Buyers want more than sellers are willing to provide at this price — expect queues or rationing.`;
    } else if (result.requestedControl) {
      note.innerHTML = '<strong>Not binding.</strong> This ceiling is set above the equilibrium price, so it has no effect — the market clears exactly as it would without it.';
    } else {
      note.innerHTML = '';
    }
  }

  [demandSlider, supplySlider, slopeDSlider, slopeSSlider, ceilingSlider].forEach((input) => input.addEventListener('input', render));
  ceilingToggle.addEventListener('change', render);

  render();
}

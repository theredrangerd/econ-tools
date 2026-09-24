import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty } from '../lib/format.js';

const DEFAULTS = { demand: 140, supply: 20, floorOn: false, floorPrice: 110 };

export function initPriceFloorPage(doc) {
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Price floor' });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const floorToggle = doc.querySelector('#floor-toggle');
  const floorSlider = doc.querySelector('#floor-slider');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const floorOn = floorToggle.checked;
    const floorPrice = +floorSlider.value;

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#floor-val').textContent = '$' + floorPrice;

    const intervention = floorOn ? { type: 'floor', price: floorPrice } : { type: 'none' };
    const result = computeMarket({ demand, supply, slopeD: 1, slopeS: 1, intervention });

    renderMarketChart(chart, result);

    const pill = doc.querySelector('#status-pill');
    pill.textContent = result.mode === 'floor' ? 'Price floor binding' : 'Free market';

    doc.querySelector('#stat-price').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-cs').textContent = result.noTrade ? '$0' : fmtMoney(result.CS);
    doc.querySelector('#stat-ps').textContent = result.noTrade ? '$0' : fmtMoney(result.PS);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    const note = doc.querySelector('#market-note');
    if (result.noTrade) {
      note.innerHTML = '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.';
    } else if (result.mode === 'floor') {
      note.innerHTML = `<strong>${fmtQty(result.gap)} units go unsold.</strong> Sellers want to supply more than buyers demand at this price.`;
    } else {
      note.innerHTML = 'Equilibrium price and quantity — every mutually beneficial trade happens.';
    }
  }

  [demandSlider, supplySlider, floorSlider].forEach((input) => input.addEventListener('input', render));
  floorToggle.addEventListener('change', render);

  doc.querySelector('#reset-btn').addEventListener('click', () => {
    demandSlider.value = DEFAULTS.demand;
    supplySlider.value = DEFAULTS.supply;
    floorToggle.checked = DEFAULTS.floorOn;
    floorSlider.value = DEFAULTS.floorPrice;
    render();
  });

  render();
}

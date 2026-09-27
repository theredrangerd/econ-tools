import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty, elasticityLabel, setStatusPill } from '../lib/format.js';
import { initFamilyNav } from '../components/familyNav.js';

const DEFAULTS = { demand: 140, supply: 20, slopeD: 1, slopeS: 1, floorOn: false, floorPrice: 110 };

export function initPriceFloorPage(doc) {
  const { backHref, backLabel } = initFamilyNav(doc.querySelector('#family-nav'), 'price-floor');
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Price floor', backHref, backLabel });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const slopeDSlider = doc.querySelector('#slope-d-slider');
  const slopeSSlider = doc.querySelector('#slope-s-slider');
  const floorToggle = doc.querySelector('#floor-toggle');
  const floorSlider = doc.querySelector('#floor-slider');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const slopeD = +slopeDSlider.value;
    const slopeS = +slopeSSlider.value;
    const floorOn = floorToggle.checked;
    const floorPrice = +floorSlider.value;

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#slope-d-val').textContent = slopeD.toFixed(1) + ' · ' + elasticityLabel(slopeD);
    doc.querySelector('#slope-s-val').textContent = slopeS.toFixed(1) + ' · ' + elasticityLabel(slopeS);
    doc.querySelector('#floor-val').textContent = '$' + floorPrice;

    const intervention = floorOn ? { type: 'floor', price: floorPrice } : { type: 'none' };
    const result = computeMarket({ demand, supply, slopeD, slopeS, intervention });

    renderMarketChart(chart, result);

    setStatusPill(doc.querySelector('#status-pill'), result.mode === 'floor' ? 'Price floor binding' : 'Free market', result.mode);

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
    } else if (result.requestedControl) {
      note.innerHTML = '<strong>Not binding.</strong> This floor is set below the equilibrium price, so it has no effect — the market clears exactly as it would without it.';
    } else {
      note.innerHTML = 'Equilibrium price and quantity — every mutually beneficial trade happens.';
    }
  }

  [demandSlider, supplySlider, slopeDSlider, slopeSSlider, floorSlider].forEach((input) => input.addEventListener('input', render));
  floorToggle.addEventListener('change', render);

  doc.querySelector('#reset-btn').addEventListener('click', () => {
    demandSlider.value = DEFAULTS.demand;
    supplySlider.value = DEFAULTS.supply;
    slopeDSlider.value = DEFAULTS.slopeD;
    slopeSSlider.value = DEFAULTS.slopeS;
    floorToggle.checked = DEFAULTS.floorOn;
    floorSlider.value = DEFAULTS.floorPrice;
    render();
  });

  render();
}

import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';
import { wireShiftAndSlopeInputs, updateShiftAndSlopeLabels, wireInterventionToggle, readCurveParams, marketFits } from '../lib/pageControls.js';
import { attachRegionExplainers } from '../lib/regionExplainers.js';

export function initPriceFloorPage(doc) {
  const { backHref, backLabel, siblings } = getFamilyNav('price-floor');
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Price floor', backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const floorToggle = doc.querySelector('#floor-toggle');
  const floorSlider = doc.querySelector('#floor-slider');

  // Animates the floor in/out on toggle: it slides from the free-market equilibrium
  // price (where a floor has zero effect) up to its slider price, so the surplus grows
  // in smoothly instead of the line snapping straight to its target.
  let toggleCtl;

  // A ceiling/floor never pushes quantity past the free-market Q*, so only the free
  // market itself needs to stay on-chart.
  const sliders = wireShiftAndSlopeInputs(doc, () => render(), () => marketFits(readCurveParams(sliders).market));

  function render() {
    const curve = readCurveParams(sliders);
    const { market } = curve;
    const floorPrice = +floorSlider.value;

    updateShiftAndSlopeLabels(doc, curve);
    doc.querySelector('#floor-val').textContent = '$' + floorPrice;

    const { Pstar } = computeMarket({ ...market, intervention: { type: 'none' } });
    const floorFraction = toggleCtl.getFraction();
    const displayPrice = Pstar + (floorPrice - Pstar) * floorFraction;
    const intervention = floorFraction > 0 ? { type: 'floor', price: displayPrice } : { type: 'none' };
    const result = computeMarket({ ...market, intervention });

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
      note.innerHTML = '';
    }
  }

  floorSlider.addEventListener('input', render);
  toggleCtl = wireInterventionToggle(floorToggle, render);

  render();
  attachRegionExplainers(chart);
}

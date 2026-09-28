import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';
import { wireShiftAndSlopeInputs, updateShiftAndSlopeLabels, wireInterventionToggle, readCurveParams, marketFits } from '../lib/pageControls.js';
import { attachRegionExplainers } from '../lib/regionExplainers.js';

export function initPriceCeilingPage(doc) {
  const { backHref, backLabel, siblings } = getFamilyNav('price-ceiling');
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Price ceiling', backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const ceilingToggle = doc.querySelector('#ceiling-toggle');
  const ceilingSlider = doc.querySelector('#ceiling-slider');

  // Animates the ceiling in/out on toggle: it slides from the free-market equilibrium
  // price (where a ceiling has zero effect) down to its slider price, so the shortage
  // grows in smoothly instead of the line snapping straight to its target.
  let toggleCtl;

  // A ceiling/floor never pushes quantity past the free-market Q*, so only the free
  // market itself needs to stay on-chart.
  const sliders = wireShiftAndSlopeInputs(doc, () => render(), () => marketFits(readCurveParams(sliders).market));

  function render() {
    const curve = readCurveParams(sliders);
    const { market } = curve;
    const ceilingPrice = +ceilingSlider.value;

    updateShiftAndSlopeLabels(doc, curve);
    doc.querySelector('#ceiling-val').textContent = '$' + ceilingPrice;

    const { Pstar } = computeMarket({ ...market, intervention: { type: 'none' } });
    const ceilingFraction = toggleCtl.getFraction();
    const displayPrice = Pstar + (ceilingPrice - Pstar) * ceilingFraction;
    const intervention = ceilingFraction > 0 ? { type: 'ceiling', price: displayPrice } : { type: 'none' };
    const result = computeMarket({ ...market, intervention });

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

  ceilingSlider.addEventListener('input', render);
  toggleCtl = wireInterventionToggle(ceilingToggle, render);

  render();
  attachRegionExplainers(chart);
}

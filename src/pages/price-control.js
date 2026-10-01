import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtPrice, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';
import { wireShiftAndSlopeInputs, updateShiftAndSlopeLabels, wireInterventionToggle, readCurveParams, marketFits, fillSharedStats, NO_TRADE_NOTE } from '../lib/pageControls.js';
import { attachRegionExplainers } from '../lib/regionExplainers.js';
import { FEEDBACK_FORM_URL } from '../lib/feedback.js';

// Shared controller for the price ceiling and price floor pages, which differ only in the
// intervention type, their element ids (`#<type>-toggle`, `#<type>-slider`, `#<type>-val`),
// and wording. Separate pages per CLAUDE.md (the regions differ); one implementation.
export function initPriceControlPage(doc, { slug, title, type, bindingPill, gapNote, notBindingNote, showRegionLabels = false }) {
  const { backHref, backLabel, siblings } = getFamilyNav(slug);
  renderMiniHeader(doc.querySelector('#mini-header'), { title, backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const toggle = doc.querySelector(`#${type}-toggle`);
  const slider = doc.querySelector(`#${type}-slider`);

  // Animates the control in/out on toggle: it slides from the free-market equilibrium
  // price (where a ceiling/floor has zero effect) to its slider price, so the shortage or
  // excess supply grows in smoothly instead of the line snapping straight to its target.
  let toggleCtl;

  // A ceiling/floor never pushes quantity past the free-market Q*, so only the free
  // market itself needs to stay on-chart.
  const sliders = wireShiftAndSlopeInputs(doc, () => render(), () => marketFits(readCurveParams(sliders).market));

  function render() {
    const curve = readCurveParams(sliders);
    const { market } = curve;
    const controlPrice = +slider.value;

    updateShiftAndSlopeLabels(doc, curve);
    doc.querySelector(`#${type}-val`).textContent = '$' + controlPrice;

    const { Pstar } = computeMarket({ ...market, intervention: { type: 'none' } });
    const fraction = toggleCtl.getFraction();
    const displayPrice = Pstar + (controlPrice - Pstar) * fraction;
    const intervention = fraction > 0 ? { type, price: displayPrice } : { type: 'none' };
    const result = computeMarket({ ...market, intervention });

    renderMarketChart(chart, result, { showSurplusLabels: slug === 'price-ceiling' || showRegionLabels });

    setStatusPill(doc.querySelector('#status-pill'), result.mode === type ? bindingPill : 'Free market', result.mode);

    doc.querySelector('#stat-price').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    fillSharedStats(doc, result);

    const note = doc.querySelector('#market-note');
    if (result.noTrade) {
      note.innerHTML = NO_TRADE_NOTE;
    } else if (result.mode === type) {
      note.innerHTML = gapNote(result.gap);
    } else if (result.requestedControl) {
      note.innerHTML = notBindingNote;
    } else {
      note.innerHTML = '';
    }
  }

  slider.addEventListener('input', render);
  toggleCtl = wireInterventionToggle(toggle, render);

  render();
  attachRegionExplainers(chart);
  doc.querySelector('#feedback-form').src = FEEDBACK_FORM_URL;
}

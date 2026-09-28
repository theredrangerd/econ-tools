import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';
import { wireShiftAndSlopeInputs, updateShiftAndSlopeLabels, wireInterventionToggle, readCurveParams, marketFits, guardSliders, settleDown, fillSharedStats, NO_TRADE_NOTE } from '../lib/pageControls.js';
import { attachRegionExplainers } from '../lib/regionExplainers.js';

export function initSubsidyPage(doc) {
  const { backHref, backLabel, siblings } = getFamilyNav('subsidy');
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Subsidy', backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const subsidySlider = doc.querySelector('#subsidy-slider');
  const subsidyToggle = doc.querySelector('#subsidy-toggle');

  // Animates the subsidy's magnitude in/out on toggle so the supply curve and its shaded
  // regions shift smoothly instead of snapping between free-market and subsidized states.
  let toggleCtl;

  // Only a switched-on subsidy constrains the sliders — one that's off shouldn't make the
  // curve sliders stop early for a reason the student can't see.
  function isValid() {
    const intervention = subsidyToggle.checked ? { type: 'subsidy', amount: +subsidySlider.value } : null;
    return marketFits(readCurveParams(sliders).market, intervention);
  }

  const sliders = wireShiftAndSlopeInputs(doc, () => render(), isValid);

  function render() {
    const curve = readCurveParams(sliders);
    const { market } = curve;
    const subsidyOn = subsidyToggle.checked;
    const amount = +subsidySlider.value;

    updateShiftAndSlopeLabels(doc, curve);
    doc.querySelector('#subsidy-val').textContent = '$' + amount;

    const subsidyFraction = toggleCtl.getFraction();
    const intervention = subsidyFraction > 0 ? { type: 'subsidy', amount: amount * subsidyFraction } : { type: 'none' };
    const result = computeMarket({ ...market, intervention });

    renderMarketChart(chart, result);

    setStatusPill(doc.querySelector('#status-pill'), subsidyOn ? 'Subsidy applied' : 'Free market', result.mode);
    doc.querySelector('#stat-price-consumer').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-price-producer').textContent = result.noTrade ? '—' : fmtPrice(result.Pp);
    fillSharedStats(doc, result);
    doc.querySelector('#stat-cost').textContent = result.noTrade ? '$0' : fmtMoney(result.govCost);
    doc.querySelector('#stat-incidence-consumer').textContent = result.noTrade || subsidyFraction <= 0 ? '$0' : fmtMoney(result.consumerIncidence);
    doc.querySelector('#stat-incidence-producer').textContent = result.noTrade || subsidyFraction <= 0 ? '$0' : fmtMoney(result.producerIncidence);

    doc.querySelector('#market-note').innerHTML = result.noTrade
      ? NO_TRADE_NOTE
      : subsidyFraction > 0
        ? `<strong>${fmtMoney(result.DWL)} of welfare is lost.</strong> The subsidy pushes output past the efficient quantity — the last few units cost more to produce than buyers value them at.`
        : '';
  }

  guardSliders([subsidySlider], isValid);
  subsidySlider.addEventListener('input', render);
  toggleCtl = wireInterventionToggle(subsidyToggle, render, { beforeOn: () => settleDown(subsidySlider, isValid) });

  render();
  attachRegionExplainers(chart);
}

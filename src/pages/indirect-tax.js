import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';
import { wireShiftAndSlopeInputs, updateShiftAndSlopeLabels, wireInterventionToggle, readCurveParams, marketFits, guardSliders, settleDown } from '../lib/pageControls.js';
import { attachRegionExplainers } from '../lib/regionExplainers.js';

export function initIndirectTaxPage(doc) {
  const { backHref, backLabel, siblings } = getFamilyNav('indirect-tax');
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Indirect tax', backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const taxToggle = doc.querySelector('#tax-toggle');
  const modeSpecific = doc.querySelector('#tax-mode-specific');
  const modeAdvalorem = doc.querySelector('#tax-mode-advalorem');
  const specificSlider = doc.querySelector('#specific-slider');
  const advaloremSlider = doc.querySelector('#advalorem-slider');
  const specificSliderWrap = doc.querySelector('#specific-slider-wrap');
  const advaloremSliderWrap = doc.querySelector('#advalorem-slider-wrap');

  // Animates the tax's magnitude in/out on toggle so the supply curve and its shaded
  // regions shift smoothly instead of snapping between free-market and taxed states.
  let toggleCtl;

  function currentMode() {
    return modeAdvalorem.checked ? 'advalorem' : 'specific';
  }

  // The tax at its full slider value (ignoring the toggle's animation fraction).
  function fullTax(mode = currentMode()) {
    return mode === 'advalorem'
      ? { type: 'tax', mode: 'advalorem', rate: (+advaloremSlider.value) / 100 }
      : { type: 'tax', mode: 'specific', amount: +specificSlider.value };
  }

  // Only a switched-on tax constrains the sliders — a tax that's off shouldn't make the
  // curve sliders stop early for a reason the student can't see.
  function isValid() {
    return marketFits(readCurveParams(sliders).market, taxToggle.checked ? fullTax() : null);
  }

  const sliders = wireShiftAndSlopeInputs(doc, () => render(), isValid);

  function render() {
    const curve = readCurveParams(sliders);
    const { market } = curve;
    const taxOn = taxToggle.checked;
    const mode = currentMode();

    specificSliderWrap.classList.toggle('open', mode === 'specific');
    advaloremSliderWrap.classList.toggle('open', mode === 'advalorem');

    updateShiftAndSlopeLabels(doc, curve);
    doc.querySelector('#specific-val').textContent = '$' + specificSlider.value;
    doc.querySelector('#advalorem-val').textContent = advaloremSlider.value + '%';

    const taxFraction = toggleCtl.getFraction();
    const intervention = taxFraction <= 0
      ? { type: 'none' }
      : (mode === 'advalorem'
        ? { type: 'tax', mode: 'advalorem', rate: ((+advaloremSlider.value) / 100) * taxFraction }
        : { type: 'tax', mode: 'specific', amount: (+specificSlider.value) * taxFraction });

    const result = computeMarket({ ...market, intervention });

    renderMarketChart(chart, result);

    setStatusPill(doc.querySelector('#status-pill'), taxOn ? 'Tax applied' : 'Free market', result.mode);
    // A tax big enough to close the market leaves no traded price to report.
    const noPrice = result.noTrade || result.closed;
    doc.querySelector('#stat-price-consumer').textContent = noPrice ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-price-producer').textContent = noPrice ? '—' : fmtPrice(result.Pp);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-cs').textContent = result.noTrade ? '$0' : fmtMoney(result.CS);
    doc.querySelector('#stat-ps').textContent = result.noTrade ? '$0' : fmtMoney(result.PS);
    doc.querySelector('#stat-revenue').textContent = result.noTrade ? '$0' : fmtMoney(result.govRevenue);
    doc.querySelector('#stat-incidence-consumer').textContent = result.noTrade || taxFraction <= 0 ? '$0' : fmtMoney(result.consumerIncidence);
    doc.querySelector('#stat-incidence-producer').textContent = result.noTrade || taxFraction <= 0 ? '$0' : fmtMoney(result.producerIncidence);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    const note = doc.querySelector('#market-note');
    if (result.noTrade) {
      note.innerHTML = '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.';
    } else if (result.closed) {
      note.innerHTML = `<strong>No units are traded.</strong> The tax is at least as big as the gap between the most any buyer will pay and the least any seller will accept, so the market shuts down and all ${fmtMoney(result.DWL)} of surplus is lost.`;
    } else if (taxFraction > 0) {
      // The lost units run from Q to Q*: buyers value them between P* and Pc, and they
      // cost sellers between Pp and P* — worth more than they cost, but not worth Pc.
      const taxText = mode === 'advalorem' ? `${advaloremSlider.value}% tax` : `$${specificSlider.value} tax`;
      note.innerHTML = `<strong>${fmtMoney(result.DWL)} of surplus is lost.</strong> ${fmtQty(result.Qstar - result.Q)} fewer units are traded. Buyers value each of them at $${result.Pstar.toFixed(0)}–$${result.Pc.toFixed(0)}, more than the $${result.Pp.toFixed(0)}–$${result.Pstar.toFixed(0)} they cost sellers to make — but with the ${taxText} on top, those trades no longer happen.`;
    } else {
      note.innerHTML = '';
    }
  }

  const settleActiveSlider = () => settleDown(currentMode() === 'advalorem' ? advaloremSlider : specificSlider, isValid);
  guardSliders([specificSlider, advaloremSlider], isValid);
  [specificSlider, advaloremSlider].forEach((input) => input.addEventListener('input', render));
  [modeSpecific, modeAdvalorem].forEach((input) => input.addEventListener('change', () => {
    settleActiveSlider();
    render();
  }));
  toggleCtl = wireInterventionToggle(taxToggle, render, { beforeOn: settleActiveSlider });

  render();
  attachRegionExplainers(chart);
}

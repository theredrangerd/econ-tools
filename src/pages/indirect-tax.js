import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty, elasticityLabel, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';
import { tweenValue } from '../lib/animate.js';

export function initIndirectTaxPage(doc) {
  const { backHref, backLabel, siblings } = getFamilyNav('indirect-tax');
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Indirect tax', backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const slopeDSlider = doc.querySelector('#slope-d-slider');
  const slopeSSlider = doc.querySelector('#slope-s-slider');
  const taxToggle = doc.querySelector('#tax-toggle');
  const modeSpecific = doc.querySelector('#tax-mode-specific');
  const modeAdvalorem = doc.querySelector('#tax-mode-advalorem');
  const specificSlider = doc.querySelector('#specific-slider');
  const advaloremSlider = doc.querySelector('#advalorem-slider');
  const specificSliderWrap = doc.querySelector('#specific-slider-wrap');
  const advaloremSliderWrap = doc.querySelector('#advalorem-slider-wrap');

  // Animates the tax's magnitude in/out on toggle so the supply curve and its shaded
  // regions shift smoothly instead of snapping between free-market and taxed states.
  let taxFraction = taxToggle.checked ? 1 : 0;
  let cancelAnim = null;

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const slopeD = +slopeDSlider.value;
    const slopeS = +slopeSSlider.value;
    const taxOn = taxToggle.checked;
    const mode = modeAdvalorem.checked ? 'advalorem' : 'specific';

    specificSliderWrap.classList.toggle('open', mode === 'specific');
    advaloremSliderWrap.classList.toggle('open', mode === 'advalorem');

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#slope-d-val').textContent = slopeD.toFixed(1) + ' · ' + elasticityLabel(slopeD);
    doc.querySelector('#slope-s-val').textContent = slopeS.toFixed(1) + ' · ' + elasticityLabel(slopeS);
    doc.querySelector('#specific-val').textContent = '$' + specificSlider.value;
    doc.querySelector('#advalorem-val').textContent = advaloremSlider.value + '%';

    const intervention = taxFraction <= 0
      ? { type: 'none' }
      : (mode === 'advalorem'
        ? { type: 'tax', mode: 'advalorem', rate: ((+advaloremSlider.value) / 100) * taxFraction }
        : { type: 'tax', mode: 'specific', amount: (+specificSlider.value) * taxFraction });

    const result = computeMarket({ demand, supply, slopeD, slopeS, intervention });

    renderMarketChart(chart, result);

    setStatusPill(doc.querySelector('#status-pill'), taxOn ? 'Tax applied' : 'Free market', result.mode);
    doc.querySelector('#stat-price-consumer').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-price-producer').textContent = result.noTrade ? '—' : fmtPrice(result.Pp);
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
    } else if (taxFraction > 0) {
      note.innerHTML = `<strong>${fmtMoney(result.DWL)} of surplus is lost.</strong> The tax wedge stops mutually beneficial trades between consumers who value the good above $${result.Pp.toFixed(0)} and sellers who would supply it below $${result.Pc.toFixed(0)}.`;
    } else {
      note.innerHTML = '';
    }
  }

  [demandSlider, supplySlider, slopeDSlider, slopeSSlider, specificSlider, advaloremSlider].forEach((input) => input.addEventListener('input', render));
  [modeSpecific, modeAdvalorem].forEach((input) => input.addEventListener('change', render));
  taxToggle.addEventListener('change', () => {
    if (cancelAnim) cancelAnim();
    cancelAnim = tweenValue({
      from: taxFraction,
      to: taxToggle.checked ? 1 : 0,
      onUpdate(v) { taxFraction = v; render(); },
      onComplete() { cancelAnim = null; },
    });
  });

  render();
}

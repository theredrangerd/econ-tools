import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty, elasticityLabel, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';
import { tweenValue } from '../lib/animate.js';

export function initPriceFloorPage(doc) {
  const { backHref, backLabel, siblings } = getFamilyNav('price-floor');
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Price floor', backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const slopeDSlider = doc.querySelector('#slope-d-slider');
  const slopeSSlider = doc.querySelector('#slope-s-slider');
  const floorToggle = doc.querySelector('#floor-toggle');
  const floorSlider = doc.querySelector('#floor-slider');

  // Animates the floor in/out on toggle: it slides from the free-market equilibrium
  // price (where a floor has zero effect) up to its slider price, so the surplus grows
  // in smoothly instead of the line snapping straight to its target.
  let floorFraction = floorToggle.checked ? 1 : 0;
  let cancelAnim = null;

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const slopeD = +slopeDSlider.value;
    const slopeS = +slopeSSlider.value;
    const floorPrice = +floorSlider.value;

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#slope-d-val').textContent = slopeD.toFixed(1) + ' · ' + elasticityLabel(slopeD);
    doc.querySelector('#slope-s-val').textContent = slopeS.toFixed(1) + ' · ' + elasticityLabel(slopeS);
    doc.querySelector('#floor-val').textContent = '$' + floorPrice;

    const { Pstar } = computeMarket({ demand, supply, slopeD, slopeS, intervention: { type: 'none' } });
    const displayPrice = Pstar + (floorPrice - Pstar) * floorFraction;
    const intervention = floorFraction > 0 ? { type: 'floor', price: displayPrice } : { type: 'none' };
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
      note.innerHTML = '';
    }
  }

  [demandSlider, supplySlider, slopeDSlider, slopeSSlider, floorSlider].forEach((input) => input.addEventListener('input', render));
  floorToggle.addEventListener('change', () => {
    if (cancelAnim) cancelAnim();
    cancelAnim = tweenValue({
      from: floorFraction,
      to: floorToggle.checked ? 1 : 0,
      onUpdate(v) { floorFraction = v; render(); },
      onComplete() { cancelAnim = null; },
    });
  });

  render();
}

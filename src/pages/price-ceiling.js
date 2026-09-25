import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty } from '../lib/format.js';
import { getUnits, familyHref, diagramHref } from '../lib/units.js';
import { renderFamilyNav } from '../components/familyNav.js';

function elasticityLabel(slope) {
  if (slope < 0.5) return 'very elastic';
  if (slope < 0.85) return 'elastic';
  if (slope <= 1.15) return 'unit elastic';
  if (slope < 2) return 'inelastic';
  return 'very inelastic';
}

const DEFAULTS = { demand: 140, supply: 20, slopeD: 1, slopeS: 1, ceilingOn: false, ceilingPrice: 50 };

export function initPriceCeilingPage(doc) {
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Price ceiling' });

  const unit = getUnits().find((u) => u.slug === 'microeconomics');
  const family = unit.families.find((f) => f.slug === 'government-intervention');
  renderFamilyNav(doc.querySelector('#family-nav'), {
    familyName: family.name,
    familyHref: familyHref(unit, family),
    siblings: family.diagrams.map((d) => ({
      name: d.name,
      href: diagramHref(unit, family, d),
      current: d.slug === 'price-ceiling',
    })),
  });

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

    const pill = doc.querySelector('#status-pill');
    pill.textContent = result.mode === 'ceiling' ? 'Price ceiling binding' : 'Free market';

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
      note.innerHTML = 'Equilibrium price and quantity — every mutually beneficial trade happens.';
    }
  }

  [demandSlider, supplySlider, slopeDSlider, slopeSSlider, ceilingSlider].forEach((input) => input.addEventListener('input', render));
  ceilingToggle.addEventListener('change', render);

  doc.querySelector('#reset-btn').addEventListener('click', () => {
    demandSlider.value = DEFAULTS.demand;
    supplySlider.value = DEFAULTS.supply;
    slopeDSlider.value = DEFAULTS.slopeD;
    slopeSSlider.value = DEFAULTS.slopeS;
    ceilingToggle.checked = DEFAULTS.ceilingOn;
    ceilingSlider.value = DEFAULTS.ceilingPrice;
    render();
  });

  render();
}

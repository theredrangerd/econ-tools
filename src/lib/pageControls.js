import { elasticityLabel } from './format.js';
import { tweenValue } from './animate.js';

// Wires the demand/supply position + elasticity sliders that every intervention page
// shares, firing `render` on input. Returns the slider elements so pages can still read
// their values directly inside render().
export function wireShiftAndSlopeInputs(doc, render) {
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const slopeDSlider = doc.querySelector('#slope-d-slider');
  const slopeSSlider = doc.querySelector('#slope-s-slider');
  [demandSlider, supplySlider, slopeDSlider, slopeSSlider].forEach((input) =>
    input.addEventListener('input', render)
  );
  return { demandSlider, supplySlider, slopeDSlider, slopeSSlider };
}

// Updates the value labels next to the shift/slope sliders wired above.
export function updateShiftAndSlopeLabels(doc, { demand, supply, slopeD, slopeS }) {
  doc.querySelector('#demand-val').textContent = demand;
  doc.querySelector('#supply-val').textContent = supply;
  doc.querySelector('#slope-d-val').textContent = slopeD.toFixed(1) + ' · ' + elasticityLabel(slopeD);
  doc.querySelector('#slope-s-val').textContent = slopeS.toFixed(1) + ' · ' + elasticityLabel(slopeS);
}

// Wires an intervention on/off toggle to tween its fraction (0 = off, 1 = fully on)
// from wherever it currently sits to its new target over ~400ms, re-rendering on every
// frame via `render` — this is the CLAUDE.md "toggle animates in/out" rule, centralized
// so every future intervention page picks it up automatically instead of re-copying the
// tween/cancel bookkeeping.
export function wireInterventionToggle(toggle, render) {
  let fraction = toggle.checked ? 1 : 0;
  let cancelAnim = null;
  toggle.addEventListener('change', () => {
    if (cancelAnim) cancelAnim();
    cancelAnim = tweenValue({
      from: fraction,
      to: toggle.checked ? 1 : 0,
      onUpdate(v) { fraction = v; render(); },
      onComplete() { cancelAnim = null; },
    });
  });
  return { getFraction: () => fraction };
}

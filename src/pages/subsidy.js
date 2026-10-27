import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';
import { wireShiftAndSlopeInputs, updateShiftAndSlopeLabels, wireInterventionToggle, readCurveParams, marketFits, guardSliders, settleDown, fillSharedStats, NO_TRADE_NOTE, DEFAULT_MARKET } from '../lib/pageControls.js';
import { attachRegionExplainers } from '../lib/regionExplainers.js';
import { FEEDBACK_FORM_URL } from '../lib/feedback.js';
import { initGraphChrome, maybeAutoStartTour, interventionTourSteps } from '../components/graphChrome.js';
import { readMode, writeMode, onModeChange, readPlayView, writePlayView } from '../lib/pageMode.js';
import { mountModeSwitch } from '../components/modeSwitch.js';
import { mountViewSwitch } from '../components/viewSwitch.js';
import { mountExplainCard } from '../components/explainCard.js';
import { SUBSIDY_STEPS } from './subsidyExplainSteps.js';

export const SUBSIDY_AREA_LABELS = 'full'; // 'full' | 'half' | 'none' — Ms. Patel request 3; flip after she confirms.

// Explorer focuses that only exist once the subsidy is on, and what the note calls them.
const SUBSIDY_ONLY_FOCUS = { overlap: 'the overlap', gov: 'government spending', dwl: 'the welfare loss' };

export function initSubsidyPage(doc, win = window) {
  const { backHref, backLabel, siblings } = getFamilyNav('subsidy');
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Subsidy', backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const chartHead = doc.querySelector('.chart-head');
  const subsidySlider = doc.querySelector('#subsidy-slider');
  const subsidyToggle = doc.querySelector('#subsidy-toggle');
  let explainers;
  let card; // the Explain step card, mounted below
  let mode = readMode(win);
  let playView = readPlayView(win);

  // No detail gear on this page: Play's IB perfect / Explorer switch replaces it, and the
  // chart is always drawn at the IB level.
  const chrome = initGraphChrome(doc, {
    chartHead,
    detailSettings: false,
    steps: (detail) => interventionTourSteps({ policyName: 'subsidy', sliderNoun: 'subsidy', clickableRegions: true, viewSwitch: true }, detail),
    onDetailChange: () => {},
  });
  const modeSwitch = mountModeSwitch(chartHead, {
    mode,
    onChange(next) { writeMode(next, win); applyMode(next); },
  });
  mountViewSwitch(chartHead, {
    view: playView.view,
    focus: playView.focus,
    onChange(next) {
      playView = next;
      writePlayView(next, win);
      explainers?.close();
      render();
    },
  });

  // ---- Play ----

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

  function updateLegend(focus) {
    doc.querySelectorAll('.legend [data-legend]').forEach((item) => {
      const key = item.dataset.legend;
      item.hidden = focus ? !['demand', 'supply', focus].includes(key) : key === 'overlap';
    });
  }

  // Play's render. Inputs on the Play controls (and the toggle's tween) keep firing it in
  // Explain too, but there it would overwrite the step's picture, so it only runs in Play.
  function render() {
    if (mode !== 'play') return;
    const curve = readCurveParams(sliders);
    const { market } = curve;
    const subsidyOn = subsidyToggle.checked;
    const amount = +subsidySlider.value;
    const { focus } = playView;

    updateShiftAndSlopeLabels(doc, curve);
    doc.querySelector('#subsidy-val').textContent = '$' + amount;

    const subsidyFraction = toggleCtl.getFraction();
    const subsidyActive = subsidyFraction > 0;
    const intervention = subsidyActive ? { type: 'subsidy', amount: amount * subsidyFraction } : { type: 'none' };
    const result = computeMarket({ ...market, intervention });

    renderMarketChart(chart, result, { showSurplusLabels: true, detail: chrome.getDetail(), focus, areaLabels: SUBSIDY_AREA_LABELS });
    updateLegend(focus);

    setStatusPill(doc.querySelector('#status-pill'), subsidyOn ? 'Subsidy applied' : 'Free market', result.mode);
    doc.querySelector('#stat-price-consumer').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-price-producer').textContent = result.noTrade ? '—' : fmtPrice(result.Pp);
    fillSharedStats(doc, result);
    doc.querySelector('#stat-cost').textContent = result.noTrade ? '$0' : fmtMoney(result.govCost);
    doc.querySelector('#stat-incidence-consumer').textContent = result.noTrade || !subsidyActive ? '$0' : fmtMoney(result.marginalCS);
    doc.querySelector('#stat-incidence-producer').textContent = result.noTrade || !subsidyActive ? '$0' : fmtMoney(result.marginalPS);

    let note = '';
    if (result.noTrade) note = NO_TRADE_NOTE;
    else if (!subsidyActive && SUBSIDY_ONLY_FOCUS[focus]) note = `Turn the subsidy on to see ${SUBSIDY_ONLY_FOCUS[focus]}.`;
    else if (subsidyActive) note = `<strong>${fmtMoney(result.DWL)} of welfare is lost.</strong> The subsidy pushes output past the efficient quantity — the last few units cost more to produce than buyers value them at.`;
    doc.querySelector('#market-note').innerHTML = note;
  }

  guardSliders([subsidySlider], isValid);
  subsidySlider.addEventListener('input', () => {
    card.refresh(); // keep the Explain slider on the same amount
    render();
  });
  toggleCtl = wireInterventionToggle(subsidyToggle, render, { beforeOn: () => settleDown(subsidySlider, isValid) });

  // ---- Explain ----
  // Always the default curves; the subsidy toggle doesn't matter here, only the step does.

  function explainResult(step) {
    const intervention = step.subsidy ? { type: 'subsidy', amount: +subsidySlider.value } : { type: 'none' };
    return computeMarket({ ...DEFAULT_MARKET, intervention });
  }

  function explainContext(step) {
    return { amount: +subsidySlider.value, result: explainResult(step) };
  }

  function renderExplain(step, { animate }) {
    if (mode !== 'explain') return;
    const ctx = explainContext(step);
    const ib = step.view === 'ib';
    renderMarketChart(chart, ctx.result, {
      detail: ib ? 'ib' : 'clean',
      // The IB wrap-up draws the full IB perfect diagram, i.e. the default layer set.
      layers: ib ? undefined : step.layers,
      captions: step.captions?.(ctx),
      areaLabels: SUBSIDY_AREA_LABELS,
      ...(animate ? { enter: step.enter, grow: step.grow } : {}),
    });
  }

  card = mountExplainCard(doc.querySelector('#explain-card'), {
    steps: SUBSIDY_STEPS,
    amount: +subsidySlider.value,
    min: +subsidySlider.min,
    max: +subsidySlider.max,
    getContext: () => explainContext(SUBSIDY_STEPS[card ? card.index() : 0]),
    onRender: (step, opts) => { explainers?.close(); renderExplain(step, opts); },
    onAmount: (amount) => { subsidySlider.value = String(amount); },
    isValidAmount: (amount) => marketFits(DEFAULT_MARKET, { type: 'subsidy', amount }),
    onFinish() {
      writeMode('play', win);
      applyMode('play');
      // Land on the diagram the student just finished: animate the subsidy on.
      if (!subsidyToggle.checked) {
        subsidyToggle.checked = true;
        subsidyToggle.dispatchEvent(new Event('change'));
      }
    },
  });

  // ---- Modes ----

  let tourChecked = false;
  function maybeTour() {
    if (tourChecked) return;
    tourChecked = true;
    maybeAutoStartTour(chrome);
  }

  function showMode() {
    doc.body.dataset.mode = mode;
    modeSwitch.setMode(mode);
    doc.querySelector('#explain-card').hidden = mode !== 'explain';
  }

  function applyMode(next) {
    if (next === mode) return;
    mode = next;
    showMode();
    explainers?.close();
    if (mode === 'explain') {
      // Arriving back in Play by the mode switch or a link follows the site rule: subsidy
      // off. Switching it off now lets the tween finish while Explain is showing.
      if (subsidyToggle.checked) {
        subsidyToggle.checked = false;
        subsidyToggle.dispatchEvent(new Event('change'));
      }
      card.goTo(0);
    } else {
      render();
      maybeTour();
    }
  }

  onModeChange(applyMode, win);

  showMode();
  if (mode === 'explain') card.goTo(0); else render();
  explainers = attachRegionExplainers(chart);
  if (mode === 'play') maybeTour();
  doc.querySelector('#feedback-form').src = FEEDBACK_FORM_URL;
}

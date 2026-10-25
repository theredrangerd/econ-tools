import { DETAIL_LEVELS } from '../lib/prefs.js';

const LABELS = { full: 'Full explanation', clean: 'Clean', ib: 'IB perfect' };

const HINTS = {
  full: 'Full explanation = fully annotated: every area labelled and explained, with the numbers.',
  clean: 'Clean = just the curves and shaded areas, without the labels and numbers.',
  ib: 'IB perfect = exactly what an exam diagram needs.',
};

const GEAR_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

// The gear on a graph's chart card and its small popover: one segmented control for the
// Full explanation → Clean → IB perfect scale. Only reports changes; the caller saves the
// choice and re-renders the chart.
export function mountDetailSettings(chartHead, { level, onChange }) {
  const doc = chartHead.ownerDocument;

  const gear = doc.createElement('button');
  gear.type = 'button';
  gear.className = 'detail-gear';
  gear.setAttribute('aria-label', 'Graph detail settings');
  gear.setAttribute('aria-expanded', 'false');
  gear.setAttribute('aria-controls', 'detail-popover');
  gear.innerHTML = GEAR_ICON;

  const popover = doc.createElement('div');
  popover.id = 'detail-popover';
  popover.className = 'detail-popover';
  popover.hidden = true;
  popover.innerHTML = `
    <p class="detail-popover__title" id="detail-popover-title">Graph detail</p>
    <div class="detail-seg" role="radiogroup" aria-labelledby="detail-popover-title">
      ${DETAIL_LEVELS.map((v) => `<label class="detail-seg__opt"><input type="radio" name="detail-level" value="${v}"><span>${LABELS[v]}</span></label>`).join('')}
    </div>
    <p class="detail-popover__hint" aria-live="polite"></p>`;

  chartHead.append(gear, popover);

  const radios = [...popover.querySelectorAll('input[name="detail-level"]')];
  const hint = popover.querySelector('.detail-popover__hint');
  const setLevel = (v) => {
    radios.forEach((r) => { r.checked = r.value === v; });
    hint.textContent = HINTS[v] ?? '';
  };
  setLevel(level);

  const setOpen = (open) => {
    popover.hidden = !open;
    gear.setAttribute('aria-expanded', String(open));
  };

  gear.addEventListener('click', () => setOpen(popover.hidden));
  // Stays open after a choice so the student watches the chart change underneath.
  popover.addEventListener('change', (e) => {
    if (e.target.name !== 'detail-level') return;
    hint.textContent = HINTS[e.target.value] ?? '';
    onChange(e.target.value);
  });
  doc.addEventListener('click', (e) => {
    if (popover.hidden || gear.contains(e.target) || popover.contains(e.target)) return;
    setOpen(false);
  });
  doc.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || popover.hidden) return;
    setOpen(false);
    gear.focus();
  });

  return { gear, setLevel };
}

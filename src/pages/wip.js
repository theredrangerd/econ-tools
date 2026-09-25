import { renderMiniHeader } from '../components/chrome.js';
import { getUnits } from '../lib/units.js';
import { FEEDBACK_FORM_URL } from '../lib/feedback.js';

export function resolveUnitName(search, units) {
  const params = new URLSearchParams(search);
  const slug = params.get('unit');
  const match = units.find((u) => u.slug === slug);
  return match ? match.name : 'This section';
}

export function initWipPage(doc, location) {
  const headerEl = doc.querySelector('#mini-header');
  const titleEl = doc.querySelector('#wip-title');
  const formEl = doc.querySelector('#feedback-form');

  const units = getUnits();
  const unitName = resolveUnitName(location.search, units);

  renderMiniHeader(headerEl, { title: unitName });
  titleEl.textContent = `${unitName} is coming soon`;
  formEl.src = FEEDBACK_FORM_URL;
}

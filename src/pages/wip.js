import { renderMiniHeader } from '../components/chrome.js';
import { getUnits } from '../lib/units.js';

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc4hUwcytl1QE3H1Iod7Ag8SRmmgDdEAPJED37kbj-ZB2O7yQ/viewform?usp=publish-editor&embedded=true';

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

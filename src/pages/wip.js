import { renderMiniHeader } from '../components/chrome.js';
import { getUnits } from '../lib/units.js';
import { FEEDBACK_FORM_URL } from '../lib/feedback.js';

export function resolveUnitName(search, units) {
  const params = new URLSearchParams(search);
  const slug = params.get('unit');
  for (const unit of units) {
    if (unit.slug === slug) return unit.name;
    for (const family of unit.families || []) {
      if (family.slug === slug) return family.name;
      const diagram = (family.diagrams || []).find((d) => d.slug === slug);
      if (diagram) return diagram.name;
    }
  }
  return 'This section';
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

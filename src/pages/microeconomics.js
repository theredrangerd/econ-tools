import { renderMiniHeader, renderHero } from '../components/chrome.js';
import { renderBento } from '../components/bento.js';
import { getUnits, familyHref } from '../lib/units.js';

export function initMicroeconomicsPage(doc) {
  const unit = getUnits().find((u) => u.slug === 'microeconomics');

  renderMiniHeader(doc.querySelector('#mini-header'), { title: unit.name });
  renderHero(doc.querySelector('#hero'), {
    eyebrow: 'MICROECONOMICS',
    title: unit.name,
    lede: 'Pick a topic family to find the graph you need — each one opens straight to a focused, interactive diagram.',
  });

  const families = unit.families.map((family) => ({
    name: family.name,
    status: family.status,
    level: family.level,
    href: familyHref(unit, family),
  }));
  renderBento(doc.querySelector('#family-bento'), families, { tiered: false });
}

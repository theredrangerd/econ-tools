import { renderMiniHeader, renderHero } from '../components/chrome.js';
import { renderBento } from '../components/bento.js';
import { getUnits, diagramHref } from '../lib/units.js';

export function initGovernmentInterventionPage(doc) {
  const unit = getUnits().find((u) => u.slug === 'microeconomics');
  const family = unit.families.find((f) => f.slug === 'government-intervention');

  renderMiniHeader(doc.querySelector('#mini-header'), { title: family.name });
  renderHero(doc.querySelector('#hero'), {
    eyebrow: 'MICROECONOMICS · GOVERNMENT INTERVENTION',
    title: family.name,
    lede: 'See how each policy tool moves the market away from its free-market equilibrium — and what that costs in deadweight loss.',
  });

  const diagrams = family.diagrams.map((diagram) => ({
    name: diagram.name,
    status: diagram.status,
    level: diagram.level,
    href: diagramHref(unit, family, diagram),
  }));
  renderBento(doc.querySelector('#diagram-bento'), diagrams, { tiered: false });
}

import { getUnits, familyHref, diagramHref } from '../lib/units.js';

export function renderFamilyNav(container, { familyName, familyHref, siblings }) {
  const links = siblings
    .map((s) => `<a href="${s.href}"${s.current ? ' aria-current="page"' : ''}>${s.name}</a>`)
    .join('');
  container.innerHTML = `
    <nav class="family-nav">
      <a class="family-nav__back" href="${familyHref}">&larr; ${familyName}</a>
      <div class="family-nav__siblings">${links}</div>
    </nav>
  `;
}

export function initFamilyNav(container, currentDiagramSlug, { unitSlug = 'microeconomics', familySlug = 'government-intervention' } = {}) {
  const unit = getUnits().find((u) => u.slug === unitSlug);
  const family = unit.families.find((f) => f.slug === familySlug);
  const backHref = familyHref(unit, family);
  renderFamilyNav(container, {
    familyName: family.name,
    familyHref: backHref,
    siblings: family.diagrams.map((d) => ({
      name: d.name,
      href: diagramHref(unit, family, d),
      current: d.slug === currentDiagramSlug,
    })),
  });
  return { backHref, backLabel: family.name };
}

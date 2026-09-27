import { getUnits, familyHref, diagramHref } from '../lib/units.js';

export function getFamilyNav(currentDiagramSlug, { unitSlug = 'microeconomics', familySlug = 'government-intervention' } = {}) {
  const unit = getUnits().find((u) => u.slug === unitSlug);
  const family = unit.families.find((f) => f.slug === familySlug);
  return {
    backHref: familyHref(unit, family),
    backLabel: family.name,
    siblings: family.diagrams.map((d) => ({
      name: d.name,
      href: diagramHref(unit, family, d),
      current: d.slug === currentDiagramSlug,
    })),
  };
}

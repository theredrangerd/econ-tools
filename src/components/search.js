function nestedSearchTerms(item) {
  return (item.families || []).flatMap((family) => [
    family.name,
    ...(family.diagrams || []).flatMap((diagram) => [diagram.name, ...(diagram.tags || [])]),
  ]);
}

export function filterGraphs(query, items) {
  const q = query.trim().toLowerCase();
  if (q === '') return items;
  return items.filter((item) => {
    const haystack = [item.name, ...(item.tags || []), ...nestedSearchTerms(item)].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

function matchesOwnText(item, q) {
  const haystack = [item.name, ...(item.tags || [])].join(' ').toLowerCase();
  return haystack.includes(q);
}

/**
 * Groups matches by their top-level unit, so a query can surface the exact
 * family/diagram it matched (not just which unit it lives under).
 * Returns null for an empty query (caller should fall back to the default browse view).
 */
export function matchGraphs(query, units) {
  const q = query.trim().toLowerCase();
  if (q === '') return null;

  return units
    .map((unit) => {
      const unitDirect = matchesOwnText(unit, q);
      const matches = [];

      (unit.families || []).forEach((family) => {
        if (matchesOwnText(family, q)) {
          matches.push({ kind: 'family', label: family.name, level: family.level, unit, family });
        }
        (family.diagrams || []).forEach((diagram) => {
          if (matchesOwnText(diagram, q)) {
            matches.push({
              kind: 'diagram',
              label: diagram.name,
              level: diagram.level,
              context: family.name,
              unit,
              family,
              diagram,
            });
          }
        });
      });

      if (!unitDirect && matches.length === 0) return null;
      return { unit, matches };
    })
    .filter(Boolean);
}

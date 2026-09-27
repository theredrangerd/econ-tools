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

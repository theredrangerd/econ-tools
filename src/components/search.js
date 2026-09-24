export function filterGraphs(query, items) {
  const q = query.trim().toLowerCase();
  if (q === '') return items;
  return items.filter((item) => {
    const haystack = [item.name, ...(item.tags || [])].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

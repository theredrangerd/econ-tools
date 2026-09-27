// src/components/searchResults.js
// Renders grouped search results: one heading per matched unit, with a row of
// direct-link chips beneath it for the specific families/diagrams that matched.
export function renderSearchResults(container, groups) {
  container.innerHTML = '';
  container.className = 'search-results';

  groups.forEach((group) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'search-results__group';

    const unitLink = document.createElement('a');
    unitLink.className = 'search-results__unit';
    unitLink.href = group.href;
    unitLink.textContent = group.unit.name;
    groupEl.appendChild(unitLink);

    if (group.matches.length > 0) {
      const chipsEl = document.createElement('div');
      chipsEl.className = 'search-results__chips';
      group.matches.forEach((match) => {
        const chip = document.createElement('a');
        chip.className = 'search-results__chip';
        chip.href = match.href;
        const context = match.context
          ? `<span class="search-results__chip-context">${match.context}</span>`
          : '';
        const levelPill = match.level ? `<span class="level-pill">${match.level}</span>` : '';
        chip.innerHTML = `${context}<span class="search-results__chip-label">${match.label}</span>${levelPill}`;
        chipsEl.appendChild(chip);
      });
      groupEl.appendChild(chipsEl);
    }

    container.appendChild(groupEl);
  });
}

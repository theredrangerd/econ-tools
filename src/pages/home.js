// src/pages/home.js
import { renderHero } from '../components/chrome.js';
import { renderBento } from '../components/bento.js';
import { renderSearchResults } from '../components/searchResults.js';
import { matchGraphs } from '../components/search.js';
import { getUnits, unitHref, familyHref, diagramHref } from '../lib/units.js';

function withHrefs(units) {
  return units.map((unit) => ({ ...unit, href: unitHref(unit) }));
}

function toResultGroups(matchGroups) {
  return matchGroups.map(({ unit, matches }) => ({
    unit,
    href: unitHref(unit),
    matches: matches.map((match) => ({
      label: match.label,
      level: match.level,
      context: match.context,
      href: match.kind === 'family'
        ? familyHref(unit, match.family)
        : diagramHref(unit, match.family, match.diagram),
    })),
  }));
}

export function initHomePage(doc) {
  const heroEl = doc.querySelector('#hero');
  const bentoEl = doc.querySelector('#bento');
  const resultsEl = doc.querySelector('#search-results');
  const searchInput = doc.querySelector('#search-input');
  const noResultsEl = doc.querySelector('#no-results');

  renderHero(heroEl, {
    eyebrow: 'IB ECONOMICS · INTERACTIVE GRAPHS',
    title: 'Understand the graph, not just the answer',
    lede: 'Interactive diagrams built for IB Economics revision — see how each intervention changes the market, not just the finished picture.',
  });

  const units = getUnits();
  renderBento(bentoEl, withHrefs(units));

  searchInput.addEventListener('input', () => {
    const matchGroups = matchGraphs(searchInput.value, units);

    if (matchGroups === null) {
      bentoEl.hidden = false;
      resultsEl.hidden = true;
      renderBento(bentoEl, withHrefs(units));
      noResultsEl.hidden = true;
      return;
    }

    bentoEl.hidden = true;
    resultsEl.hidden = false;
    const groups = toResultGroups(matchGroups);
    renderSearchResults(resultsEl, groups);
    noResultsEl.hidden = groups.length !== 0;
  });
}

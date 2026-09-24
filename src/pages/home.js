import { renderHero } from '../components/chrome.js';
import { renderBento } from '../components/bento.js';
import { filterGraphs } from '../components/search.js';
import { getUnits } from '../lib/units.js';

export function initHomePage(doc) {
  const heroEl = doc.querySelector('#hero');
  const bentoEl = doc.querySelector('#bento');
  const searchInput = doc.querySelector('#search-input');
  const noResultsEl = doc.querySelector('#no-results');

  renderHero(heroEl, {
    eyebrow: 'IB ECONOMICS · INTERACTIVE GRAPHS',
    title: 'Understand the graph, not just the answer',
    lede: 'Interactive diagrams built for IB Economics revision — see how each intervention changes the market, not just the finished picture.',
  });

  const units = getUnits();
  renderBento(bentoEl, units);

  searchInput.addEventListener('input', () => {
    const results = filterGraphs(searchInput.value, units);
    renderBento(bentoEl, results);
    noResultsEl.hidden = results.length !== 0;
  });
}

import { describe, it, expect, beforeEach } from 'vitest';
import { initHomePage } from './home.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="hero"></div>
    <input id="search-input" />
    <div id="bento"></div>
    <div id="search-results" hidden></div>
    <p id="no-results" hidden>No graphs match that search yet.</p>
  `;
}

describe('initHomePage', () => {
  beforeEach(() => {
    buildDom();
    initHomePage(document);
  });

  it('renders all 4 unit tiles on load with no query typed', () => {
    expect(document.querySelectorAll('#bento a.bento__tile')).toHaveLength(4);
    expect(document.querySelector('#search-results').hidden).toBe(true);
  });

  it('links the Microeconomics tile to its real unit page, not the WIP stub', () => {
    const link = document.querySelector('a[href="/units/microeconomics.html"]');
    expect(link).not.toBeNull();
  });

  it('switches from the bento grid to grouped results as the user types, hiding no-results when matches exist', () => {
    const input = document.querySelector('#search-input');
    input.value = 'micro';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelector('#bento').hidden).toBe(true);
    expect(document.querySelector('#search-results').hidden).toBe(false);
    expect(document.querySelectorAll('#search-results .search-results__unit')).toHaveLength(1);
    expect(document.querySelector('#no-results').hidden).toBe(true);
  });

  it('surfaces the specific matched family/diagram as a direct-link chip beneath its unit', () => {
    const input = document.querySelector('#search-input');
    input.value = 'subsidy';
    input.dispatchEvent(new Event('input'));
    const unitHeading = document.querySelector('#search-results .search-results__unit');
    expect(unitHeading.textContent).toBe('Microeconomics');
    const chip = document.querySelector('#search-results .search-results__chip');
    expect(chip).not.toBeNull();
    expect(chip.getAttribute('href')).toBe('/units/microeconomics/government-intervention/subsidy.html');
    expect(chip.textContent).toContain('Subsidy');
  });

  it('shows the no-results message when nothing matches', () => {
    const input = document.querySelector('#search-input');
    input.value = 'nonexistent topic';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelectorAll('#search-results .search-results__group')).toHaveLength(0);
    expect(document.querySelector('#no-results').hidden).toBe(false);
  });

  it('shows the bento grid again when the search is cleared', () => {
    const input = document.querySelector('#search-input');
    input.value = 'micro';
    input.dispatchEvent(new Event('input'));
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelector('#bento').hidden).toBe(false);
    expect(document.querySelector('#search-results').hidden).toBe(true);
    expect(document.querySelectorAll('#bento a.bento__tile')).toHaveLength(4);
    expect(document.querySelector('#no-results').hidden).toBe(true);
  });
});

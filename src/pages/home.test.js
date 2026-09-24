import { describe, it, expect, beforeEach } from 'vitest';
import { initHomePage } from './home.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="hero"></div>
    <input id="search-input" />
    <div id="bento"></div>
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
  });

  it('filters tiles as the user types and hides the no-results message when matches exist', () => {
    const input = document.querySelector('#search-input');
    input.value = 'micro';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelectorAll('#bento a.bento__tile')).toHaveLength(1);
    expect(document.querySelector('#no-results').hidden).toBe(true);
  });

  it('shows the no-results message when nothing matches', () => {
    const input = document.querySelector('#search-input');
    input.value = 'nonexistent topic';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelectorAll('#bento a.bento__tile')).toHaveLength(0);
    expect(document.querySelector('#no-results').hidden).toBe(false);
  });

  it('shows all tiles again when the search is cleared', () => {
    const input = document.querySelector('#search-input');
    input.value = 'micro';
    input.dispatchEvent(new Event('input'));
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelectorAll('#bento a.bento__tile')).toHaveLength(4);
    expect(document.querySelector('#no-results').hidden).toBe(true);
  });
});

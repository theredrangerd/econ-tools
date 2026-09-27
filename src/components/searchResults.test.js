import { describe, it, expect, beforeEach } from 'vitest';
import { renderSearchResults } from './searchResults.js';

describe('renderSearchResults', () => {
  let container;
  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders a unit heading linked to the unit page, and one chip per matched family/diagram', () => {
    renderSearchResults(container, [
      {
        unit: { name: 'Microeconomics' },
        href: '/units/microeconomics.html',
        matches: [
          { label: 'Subsidy', level: 'SL', context: 'Government Intervention', href: '/a.html' },
        ],
      },
    ]);

    const unitLink = container.querySelector('.search-results__unit');
    expect(unitLink.getAttribute('href')).toBe('/units/microeconomics.html');
    expect(unitLink.textContent).toBe('Microeconomics');

    const chip = container.querySelector('.search-results__chip');
    expect(chip.getAttribute('href')).toBe('/a.html');
    expect(chip.textContent).toContain('Subsidy');
    expect(chip.textContent).toContain('Government Intervention');
    expect(chip.querySelector('.level-pill').textContent).toBe('SL');
  });

  it('omits the chips row entirely when a group has no specific matches', () => {
    renderSearchResults(container, [
      { unit: { name: 'Macroeconomics' }, href: '/units/macroeconomics.html', matches: [] },
    ]);
    expect(container.querySelector('.search-results__chips')).toBeNull();
  });

  it('renders one group per matched unit', () => {
    renderSearchResults(container, [
      { unit: { name: 'Microeconomics' }, href: '/a.html', matches: [] },
      { unit: { name: 'Macroeconomics' }, href: '/b.html', matches: [] },
    ]);
    expect(container.querySelectorAll('.search-results__group')).toHaveLength(2);
  });
});

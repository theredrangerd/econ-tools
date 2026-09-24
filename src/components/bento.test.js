import { describe, it, expect, beforeEach } from 'vitest';
import { renderBento } from './bento.js';
import { getUnits } from '../lib/units.js';

describe('renderBento', () => {
  let container;
  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders one real anchor tile per unit, so keyboard and right-click navigation both work', () => {
    renderBento(container, getUnits());
    const tiles = container.querySelectorAll('a.bento__tile');
    expect(tiles).toHaveLength(4);
    tiles.forEach((tile) => {
      expect(tile.tagName).toBe('A');
      const href = tile.getAttribute('href');
      expect(href).toMatch(/^\/units\/([a-z-]+\.html|wip\.html\?unit=[a-z-]+)$/);
    });
  });

  it('applies the fixed tier as a CSS class on each tile', () => {
    renderBento(container, getUnits());
    const micro = container.querySelector('a[href="/units/microeconomics.html"]');
    expect(micro.className).toContain('bento__tile--large');
  });

  it('renders zero tiles for an empty unit list, without throwing', () => {
    expect(() => renderBento(container, [])).not.toThrow();
    expect(container.querySelectorAll('a.bento__tile')).toHaveLength(0);
  });

  it('shows a "coming soon" badge on tiles whose unit is not built yet, so the homepage stays honest about completeness', () => {
    renderBento(container, [{ slug: 'microeconomics', name: 'Microeconomics', tier: 'large', status: 'coming-soon' }]);
    const badge = container.querySelector('a.bento__tile .bento__badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('Coming soon');
  });

  it('omits the badge for a unit with no status set', () => {
    renderBento(container, [{ slug: 'microeconomics', name: 'Microeconomics', tier: 'large' }]);
    expect(container.querySelector('a.bento__tile .bento__badge')).toBeNull();
  });
});

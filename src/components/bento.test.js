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
      expect(tile.getAttribute('href')).toMatch(/^\/units\/wip\.html\?unit=/);
    });
  });

  it('applies the fixed tier as a CSS class on each tile', () => {
    renderBento(container, getUnits());
    const micro = container.querySelector('a[href="/units/wip.html?unit=microeconomics"]');
    expect(micro.className).toContain('bento__tile--large');
  });

  it('renders zero tiles for an empty unit list, without throwing', () => {
    expect(() => renderBento(container, [])).not.toThrow();
    expect(container.querySelectorAll('a.bento__tile')).toHaveLength(0);
  });
});

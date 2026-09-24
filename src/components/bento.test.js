import { describe, it, expect, beforeEach } from 'vitest';
import { renderBento } from './bento.js';

function homepageUnits() {
  return [
    { name: 'Microeconomics', tier: 'large', status: 'built', href: '/units/microeconomics.html' },
    { name: 'Macroeconomics', tier: 'medium', status: 'coming-soon', href: '/units/wip.html?unit=macroeconomics' },
  ];
}

describe('renderBento', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders one real anchor tile per item, using the precomputed href, so keyboard and right-click navigation both work', () => {
    renderBento(container, homepageUnits());
    const tiles = container.querySelectorAll('a.bento__tile');
    expect(tiles).toHaveLength(2);
    expect(tiles[0].getAttribute('href')).toBe('/units/microeconomics.html');
  });

  it('applies the tier as a CSS class by default', () => {
    renderBento(container, homepageUnits());
    const micro = container.querySelector('a[href="/units/microeconomics.html"]');
    expect(micro.className).toContain('bento__tile--large');
  });

  it('omits the tier class when options.tiered is false, for uniform family/diagram grids', () => {
    renderBento(container, [{ name: 'Price ceiling', status: 'built', href: '/units/microeconomics/government-intervention/price-ceiling.html', level: 'SL' }], { tiered: false });
    const tile = container.querySelector('a.bento__tile');
    expect(tile.className).not.toMatch(/bento__tile--/);
  });

  it('renders zero tiles for an empty item list, without throwing', () => {
    expect(() => renderBento(container, [])).not.toThrow();
    expect(container.querySelectorAll('a.bento__tile')).toHaveLength(0);
  });

  it('shows a "coming soon" badge on tiles whose item is not built yet, so the page stays honest about completeness', () => {
    renderBento(container, [{ name: 'Macroeconomics', tier: 'medium', status: 'coming-soon', href: '/units/wip.html?unit=macroeconomics' }]);
    const badge = container.querySelector('a.bento__tile .bento__badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('Coming soon');
  });

  it('omits the coming-soon badge for a built item', () => {
    renderBento(container, [{ name: 'Microeconomics', tier: 'large', status: 'built', href: '/units/microeconomics.html' }]);
    expect(container.querySelector('a.bento__tile .bento__badge')).toBeNull();
  });

  it('renders a level pill when the item has a level, for SL/HL diagram tiles', () => {
    renderBento(container, [{ name: 'Price ceiling', status: 'built', href: '/x.html', level: 'SL' }], { tiered: false });
    const pill = container.querySelector('a.bento__tile .level-pill');
    expect(pill).not.toBeNull();
    expect(pill.textContent).toBe('SL');
  });

  it('omits the level pill when the item has no level', () => {
    renderBento(container, homepageUnits());
    expect(container.querySelector('a.bento__tile .level-pill')).toBeNull();
  });
});

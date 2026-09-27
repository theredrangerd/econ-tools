import { describe, it, expect, beforeEach } from 'vitest';
import { renderFamilyNav } from './familyNav.js';

describe('renderFamilyNav', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders a back link to the family page', () => {
    renderFamilyNav(container, {
      familyName: 'Government Intervention',
      familyHref: '/units/microeconomics/government-intervention.html',
      siblings: [],
    });
    const back = container.querySelector('.family-nav__back');
    expect(back.getAttribute('href')).toBe('/units/microeconomics/government-intervention.html');
    expect(back.textContent).toContain('Government Intervention');
  });

  it('renders one link per sibling, marking the current page', () => {
    renderFamilyNav(container, {
      familyName: 'Government Intervention',
      familyHref: '/units/microeconomics/government-intervention.html',
      siblings: [
        { name: 'Price ceiling', href: '/a.html', current: true },
        { name: 'Price floor', href: '/b.html', current: false },
      ],
    });
    const links = container.querySelectorAll('.family-nav__siblings a');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('aria-current')).toBe('page');
    expect(links[1].hasAttribute('aria-current')).toBe(false);
  });
});

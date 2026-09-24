import { describe, it, expect, beforeEach } from 'vitest';
import { initMicroeconomicsPage } from './microeconomics.js';

describe('initMicroeconomicsPage', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="mini-header"></div>
      <div id="hero"></div>
      <div id="family-bento"></div>
    `;
    initMicroeconomicsPage(document);
  });

  it('renders one tile per topic family', () => {
    expect(document.querySelectorAll('#family-bento a.bento__tile')).toHaveLength(5);
  });

  it('links the built Government Intervention family to its real page', () => {
    const link = document.querySelector('a[href="/units/microeconomics/government-intervention.html"]');
    expect(link).not.toBeNull();
    expect(link.querySelector('.bento__badge')).toBeNull();
  });

  it('links every other family to the WIP stub, tagged with its own slug', () => {
    const link = document.querySelector('a[href="/units/wip.html?unit=demand-and-supply"]');
    expect(link).not.toBeNull();
    expect(link.querySelector('.bento__badge')).not.toBeNull();
  });

  it('shows HL pill only on Theory of the Firm tile', () => {
    // Theory of the Firm has status 'coming-soon', so its href should be the WIP stub
    const tfLink = document.querySelector('a[href="/units/wip.html?unit=theory-of-the-firm"]');
    expect(tfLink).not.toBeNull();

    // Theory of the Firm should have the level-pill with text 'HL'
    const tfPill = tfLink.querySelector('.level-pill');
    expect(tfPill).not.toBeNull();
    expect(tfPill.textContent).toBe('HL');

    // No other family tiles should have a level-pill
    const allPills = document.querySelectorAll('#family-bento .level-pill');
    expect(allPills).toHaveLength(1);
  });
});

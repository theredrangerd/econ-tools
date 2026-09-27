import { describe, it, expect, beforeEach } from 'vitest';
import { initGovernmentInterventionPage } from './government-intervention.js';

describe('initGovernmentInterventionPage', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="mini-header"></div>
      <div id="hero"></div>
      <div id="diagram-bento"></div>
    `;
    initGovernmentInterventionPage(document);
  });

  it('renders one tile per diagram in the family', () => {
    expect(document.querySelectorAll('#diagram-bento a.bento__tile')).toHaveLength(4);
  });

  it('links the four built diagrams to their real pages with an SL pill', () => {
    const link = document.querySelector('a[href="/units/microeconomics/government-intervention/price-ceiling.html"]');
    expect(link).not.toBeNull();
    expect(link.querySelector('.level-pill').textContent).toBe('SL');
    expect(link.querySelector('.bento__badge')).toBeNull();
  });
});

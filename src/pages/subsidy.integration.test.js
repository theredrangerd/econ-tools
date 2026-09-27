import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSubsidyPage } from './subsidy.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initSubsidyPage against the real page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention', 'subsidy.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
  });

  it('wires up against the real ids without throwing, and shows the free-market default', () => {
    expect(() => initSubsidyPage(document)).not.toThrow();
    expect(document.querySelector('#stat-cost').textContent).toBe('$0');
  });

  it('applies the subsidy outcome once the subsidy toggle is switched on', () => {
    initSubsidyPage(document);
    document.querySelector('#subsidy-toggle').checked = true;
    document.querySelector('#subsidy-toggle').dispatchEvent(new Event('change'));
    expect(document.querySelector('#stat-cost').textContent).toBe('$1,400');
  });

  it('renders a mini-header back link plus sibling diagram links, with no separate family-nav row', () => {
    initSubsidyPage(document);
    const back = document.querySelector('#mini-header a.mini-header__back');
    expect(back).not.toBeNull();
    expect(back.getAttribute('href')).toBe('/units/microeconomics/government-intervention.html');
    const siblingLinks = document.querySelectorAll('#mini-header .mini-header__siblings a');
    expect(siblingLinks.length).toBeGreaterThan(0);
    expect(document.querySelector('#family-nav')).toBeNull();
  });
});

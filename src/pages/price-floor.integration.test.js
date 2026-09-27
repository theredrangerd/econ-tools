import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initPriceFloorPage } from './price-floor.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initPriceFloorPage against the real page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention', 'price-floor.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
  });

  it('wires up against the real ids without throwing, and shows the free-market baseline', () => {
    expect(() => initPriceFloorPage(document)).not.toThrow();
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
  });

  it('renders a mini-header back link plus sibling diagram links, with no separate family-nav row', () => {
    initPriceFloorPage(document);
    const back = document.querySelector('#mini-header a.mini-header__back');
    expect(back).not.toBeNull();
    expect(back.getAttribute('href')).toBe('/units/microeconomics/government-intervention.html');
    const siblingLinks = document.querySelectorAll('#mini-header .mini-header__siblings a');
    expect(siblingLinks.length).toBeGreaterThan(0);
    expect(document.querySelector('#family-nav')).toBeNull();
  });

  it('renders three real-world example links that open in a new tab safely', () => {
    const links = document.querySelectorAll('.examples-list a');
    expect(links).toHaveLength(3);
    links.forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initPriceCeilingPage } from './price-ceiling.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initPriceCeilingPage against the real page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention', 'price-ceiling.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
  });

  it('wires up against the real ids without throwing, and shows the free-market baseline', () => {
    expect(() => initPriceCeilingPage(document)).not.toThrow();
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
  });
});

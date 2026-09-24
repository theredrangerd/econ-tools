import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initIndirectTaxPage } from './indirect-tax.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initIndirectTaxPage against the real page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention', 'indirect-tax.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
  });

  it('wires up against the real ids without throwing, and shows the default specific-tax outcome', () => {
    expect(() => initIndirectTaxPage(document)).not.toThrow();
    expect(document.querySelector('#stat-revenue').textContent).toBe('$1,000');
  });
});

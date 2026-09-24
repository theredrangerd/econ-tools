// src/styles/pages.test.js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function readPagesCss() {
  const dir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(dir, 'pages.css'), 'utf8');
}

describe('shared pages stylesheet', () => {
  it('defines the graph-page layout classes ported from the Equilibrium Lab prototype', () => {
    const css = readPagesCss();
    [
      '.layout', '.card', '.chart-card', '.chart-title', '.status-pill',
      '.legend', '.sidebar', '.panel', '.slider-row', '.toggle-row',
      '.switch', '.sub-slider', '.stats-grid', '.stat', '.note', '.reset-btn',
    ].forEach((selector) => {
      expect(css).toContain(selector);
    });
  });

  it('defines a level-pill class for the SL/HL badge', () => {
    expect(readPagesCss()).toContain('.level-pill');
  });

  it('defines a gov stat variant for tax revenue / subsidy cost figures', () => {
    expect(readPagesCss()).toContain('.stat.gov');
  });
});

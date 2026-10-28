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
      '.layout', '.main-col', '.card', '.chart-card', '.chart-title', '.status-pill',
      '.legend', '.sidebar', '.panel', '.slider-row', '.toggle-row',
      '.switch', '.sub-slider', '.stats-grid', '.stat', '.note', '.examples-list', '.examples-panel',
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

  it('defines styles for the diagram page header (header.top)', () => {
    const css = readPagesCss();
    expect(css).toContain('header.top');
    expect(css).toContain('header.top .eyebrow');
  });

  it('hides the Play-only chrome in Explain, status pill included, and caps the Explain column', () => {
    const css = readPagesCss();
    const hideRule = css.match(/((?:body\[data-mode="explain"\] [^,{]+,\s*)+body\[data-mode="explain"\] [^,{]+)\{\s*display:\s*none;\s*\}/);
    expect(hideRule).not.toBeNull();
    const hidden = hideRule[1].split(',').map((sel) => sel.trim().replace('body[data-mode="explain"] ', ''));
    expect(hidden).toEqual(expect.arrayContaining(['.sidebar', '#outcome-panel', '.legend', '.view-switch', '.focus-bar', '#status-pill', '.tour-replay']));
    // The Explain column is sized from the viewport height so chart + step card fit one screen.
    expect(css).toMatch(/body\[data-mode="explain"\] \.main-col\s*\{[^}]*max-width:\s*max\(362px,\s*min\(760px,\s*calc\(\(100svh - var\(--explain-chrome-h\)\) \* 1\.5\)\)\);[^}]*margin-inline:\s*auto;/);
  });
});

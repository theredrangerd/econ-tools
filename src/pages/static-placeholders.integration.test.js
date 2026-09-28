import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initPriceCeilingPage } from './price-ceiling.js';
import { initPriceFloorPage } from './price-floor.js';
import { initIndirectTaxPage } from './indirect-tax.js';
import { initSubsidyPage } from './subsidy.js';

// The stat tiles and slider readouts ship with hardcoded text that's visible until the
// page script runs (and is what a no-JS reader or a slow load sees). It must match the
// first render exactly, or a default-market change silently leaves stale numbers behind.
const PAGES = [
  ['price-ceiling', initPriceCeilingPage],
  ['price-floor', initPriceFloorPage],
  ['indirect-tax', initIndirectTaxPage],
  ['subsidy', initSubsidyPage],
];

const dir = dirname(fileURLToPath(import.meta.url));
const SELECTOR = '[id^="stat-"], .slider-label .val, #status-pill';

describe('static HTML placeholders match the first render', () => {
  it.each(PAGES)('%s', (slug, init) => {
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention', `${slug}.html`), 'utf8');
    document.body.innerHTML = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
    const before = [...document.querySelectorAll(SELECTOR)].map((node) => [node.id, node.textContent]);
    init(document);
    const after = [...document.querySelectorAll(SELECTOR)].map((node) => [node.id, node.textContent]);
    expect(before).toEqual(after);
  });
});

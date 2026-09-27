import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initGovernmentInterventionPage } from './government-intervention.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initGovernmentInterventionPage against the real family page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
    initGovernmentInterventionPage(document);
  });

  it('wires up against the real ids without throwing, and renders all 5 diagram tiles', () => {
    expect(document.querySelectorAll('#diagram-bento a.bento__tile')).toHaveLength(5);
  });
});

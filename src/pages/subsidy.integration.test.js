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

  it('wires up against the real ids without throwing, and shows the default subsidy outcome', () => {
    expect(() => initSubsidyPage(document)).not.toThrow();
    expect(document.querySelector('#stat-cost').textContent).toBe('$1,400');
  });

  it('renders a family nav back link to the Government Intervention family page', () => {
    initSubsidyPage(document);
    const back = document.querySelector('#family-nav a.family-nav__back');
    expect(back).not.toBeNull();
    expect(back.getAttribute('href')).toBe('/units/microeconomics/government-intervention.html');
  });
});

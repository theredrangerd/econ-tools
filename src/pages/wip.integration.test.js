import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initWipPage } from './wip.js';

function bodyOf(html) {
  const match = html.match(/<body>([\s\S]*)<\/body>/);
  return match[1];
}

describe('initWipPage against the real units/wip.html markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'wip.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
  });

  it('wires up against the real ids without throwing, for a known unit', () => {
    expect(() => initWipPage(document, { search: '?unit=microeconomics' })).not.toThrow();
    expect(document.querySelector('#wip-title').textContent).toBe('Microeconomics is coming soon');
    expect(document.querySelector('#feedback-form').src).toContain('docs.google.com/forms');
  });

  it('wires up against the real ids without throwing, with no query string', () => {
    expect(() => initWipPage(document, { search: '' })).not.toThrow();
    expect(document.querySelector('#wip-title').textContent).toBe('This section is coming soon');
  });
});

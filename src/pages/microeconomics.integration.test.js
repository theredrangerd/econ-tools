import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initMicroeconomicsPage } from './microeconomics.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initMicroeconomicsPage against the real units/microeconomics.html markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
    initMicroeconomicsPage(document);
  });

  it('wires up against the real ids without throwing, and renders all 5 family tiles', () => {
    expect(document.querySelectorAll('#family-bento a.bento__tile')).toHaveLength(5);
  });

  it('embeds the feedback form', () => {
    expect(document.querySelector('#feedback-form').src).toContain('docs.google.com/forms');
  });
});

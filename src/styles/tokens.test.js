import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function readTokensCss() {
  const dir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(dir, 'tokens.css'), 'utf8');
}

describe('design tokens stylesheet', () => {
  it('defines the core color tokens carried over from Equilibrium Lab', () => {
    const css = readTokensCss();
    ['--bg', '--surface', '--ink', '--demand', '--supply', '--dwl-line', '--accent', '--good'].forEach((token) => {
      expect(css).toContain(`${token}:`);
    });
  });

  it('defines a dark-mode override block', () => {
    const css = readTokensCss();
    expect(css).toContain('prefers-color-scheme: dark');
  });
});

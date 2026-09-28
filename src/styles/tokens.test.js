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

  it('does not auto-switch to dark mode based on OS preference', () => {
    const css = readTokensCss();
    expect(css).not.toContain('prefers-color-scheme: dark');
  });

  it('keeps a manual dark-theme override block for future use', () => {
    const css = readTokensCss();
    expect(css).toContain('data-theme="dark"');
  });

  it('defines a microeconomics unit accent token, independent of tile tier', () => {
    const css = readTokensCss();
    expect(css).toContain('--unit-microeconomics:');
  });
});

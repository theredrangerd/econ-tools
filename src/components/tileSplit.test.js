import { describe, it, expect, beforeEach } from 'vitest';
import { enableTileSplit } from './tileSplit.js';

describe('enableTileSplit', () => {
  let tile;
  beforeEach(() => {
    document.body.innerHTML = '<div id="g"><a class="bento__tile bento__tile--subsidy" href="/s.html">Subsidy</a></div>';
    tile = document.querySelector('a.bento__tile');
    enableTileSplit(tile, [
      { mode: 'explain', label: 'Explain', href: '/s.html#explain' },
      { mode: 'play', label: 'Play', href: '/s.html#play' },
    ]);
  });
  const click = (el = tile) => {
    const e = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    return e;
  };

  it('splits into Explain and Play links and hides the tile', () => {
    const e = click();
    expect(e.defaultPrevented).toBe(true);
    const split = document.querySelectorAll('.bento__split');
    expect(split).toHaveLength(1);
    const links = split[0].querySelectorAll('a.bento__mode');
    expect([...links].map((a) => a.getAttribute('href'))).toEqual(['/s.html#explain', '/s.html#play']);
    expect([...links].map((a) => a.textContent)).toEqual(['Explain', 'Play']);
    expect(split[0].classList.contains('bento__tile--subsidy')).toBe(true);
    expect(tile.hidden).toBe(true);
    expect(document.activeElement).toBe(links[0]);
  });

  it.each([
    ['meta', { metaKey: true }], ['ctrl', { ctrlKey: true }], ['shift', { shiftKey: true }],
    ['alt', { altKey: true }], ['middle-button', { button: 1 }],
  ])('lets a %s click navigate instead of splitting', (_, mods) => {
    const e = new MouseEvent('click', { bubbles: true, cancelable: true, ...mods });
    tile.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(document.querySelector('.bento__split')).toBeNull();
    expect(tile.hidden).toBe(false);
  });

  it('ignores a second activation', () => {
    click();
    click();
    expect(document.querySelectorAll('.bento__split')).toHaveLength(1);
  });

  it('Escape restores the tile and focuses it', () => {
    click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.querySelector('.bento__split')).toBeNull();
    expect(tile.hidden).toBe(false);
    expect(document.activeElement).toBe(tile);
  });

  it('a click outside restores the tile', () => {
    click();
    document.body.click();
    expect(document.querySelector('.bento__split')).toBeNull();
    expect(tile.hidden).toBe(false);
  });
});

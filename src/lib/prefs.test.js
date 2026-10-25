import { describe, it, expect, beforeEach } from 'vitest';
import { DETAIL_LEVELS, getDetailLevel, setDetailLevel, hasSeenTour, markTourSeen } from './prefs.js';

// A window stand-in whose storage is blocked (private mode, site data disabled).
function blockedWin(search = '') {
  const boom = () => { throw new Error('blocked'); };
  return {
    localStorage: { getItem: boom, setItem: boom },
    location: { search, pathname: '/', hash: '' },
    history: { replaceState() {} },
  };
}

describe('prefs', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/');
  });

  it('lists the three detail levels in order', () => {
    expect(DETAIL_LEVELS).toEqual(['full', 'clean', 'ib']);
  });

  it('defaults to full when nothing is set', () => {
    expect(getDetailLevel()).toBe('full');
  });

  it('reads a stored level', () => {
    localStorage.setItem('econ.detail', 'clean');
    expect(getDetailLevel()).toBe('clean');
  });

  it('lets a ?detail= URL param win over the stored level without overwriting it', () => {
    localStorage.setItem('econ.detail', 'clean');
    history.replaceState(null, '', '/?detail=ib');
    expect(getDetailLevel()).toBe('ib');
    expect(localStorage.getItem('econ.detail')).toBe('clean');
  });

  it('ignores invalid URL and stored values', () => {
    localStorage.setItem('econ.detail', 'x');
    history.replaceState(null, '', '/?detail=banana');
    expect(getDetailLevel()).toBe('full');
  });

  it('stores a chosen level and drops the detail URL param', () => {
    history.replaceState(null, '', '/?detail=clean&x=1');
    setDetailLevel('ib');
    expect(localStorage.getItem('econ.detail')).toBe('ib');
    expect(location.search).toBe('?x=1');
  });

  it('tracks whether the tour has been seen', () => {
    expect(hasSeenTour()).toBe(false);
    markTourSeen();
    expect(hasSeenTour()).toBe(true);
  });

  it('fails quiet when storage throws: tour counts as seen, detail falls back to full', () => {
    const win = blockedWin();
    expect(hasSeenTour(win)).toBe(true);
    expect(getDetailLevel(win)).toBe('full');
    expect(() => setDetailLevel('ib', win)).not.toThrow();
    expect(() => markTourSeen(win)).not.toThrow();
  });

  it('still honours a URL level when storage throws', () => {
    expect(getDetailLevel(blockedWin('?detail=clean'))).toBe('clean');
  });
});

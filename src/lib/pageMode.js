// URL state for the subsidy page: Explain/Play mode lives in the hash, the Play view
// (IB perfect vs Explorer) and Explorer focus live in query params. All writes use
// replaceState so toggling never piles up history entries, and a failing history API
// just leaves the address bar as it was.

import { FOCUS_IDS } from './marketChart.js';

const VIEW_PARAM = 'view';
const FOCUS_PARAM = 'focus';
// The subsidy page has no detail levels; an old link's ?detail= is dropped on the next write.
const STALE_PARAMS = ['detail'];

export function readMode(win = window) {
  return win.location.hash === '#explain' ? 'explain' : 'play';
}

function replaceUrl(win, params, hash) {
  STALE_PARAMS.forEach((name) => params.delete(name));
  const qs = params.toString();
  try {
    win.history.replaceState(null, '', `${win.location.pathname}${qs ? `?${qs}` : ''}${hash}`);
  } catch { /* history unavailable: the address bar just stays as it was */ }
}

export function writeMode(mode, win = window) {
  replaceUrl(win, new URLSearchParams(win.location.search), mode === 'explain' ? '#explain' : '#play');
}

export function onModeChange(cb, win = window) {
  const handler = () => cb(readMode(win));
  win.addEventListener('hashchange', handler);
  return () => win.removeEventListener('hashchange', handler);
}

export function readPlayView(win = window) {
  const params = new URLSearchParams(win.location.search);
  const rawFocus = params.get(FOCUS_PARAM);
  const focus = FOCUS_IDS.includes(rawFocus) ? rawFocus : null;
  const view = focus || params.get(VIEW_PARAM) === 'explorer' ? 'explorer' : 'ib';
  return { view, focus };
}

export function writePlayView({ view, focus }, win = window) {
  const params = new URLSearchParams(win.location.search);
  params.delete(VIEW_PARAM);
  params.delete(FOCUS_PARAM);
  if (view === 'explorer') {
    params.set(VIEW_PARAM, 'explorer');
    if (focus) params.set(FOCUS_PARAM, focus);
  }
  replaceUrl(win, params, win.location.hash);
}

// Per-browser preferences shared by every graph page: the chart detail level and whether
// the first-visit walkthrough has been shown. Storage can be missing or throw (private
// mode, blocked site data), so every access is guarded and the page still works without it.

export const DETAIL_LEVELS = Object.freeze(['full', 'clean', 'ib']);

const DETAIL_KEY = 'econ.detail';
const TOUR_KEY = 'econ.tourSeen';
const DETAIL_PARAM = 'detail';

const isLevel = (v) => DETAIL_LEVELS.includes(v);

function read(win, key) {
  try { return win.localStorage.getItem(key); } catch { return undefined; }
}

function write(win, key, value) {
  try { win.localStorage.setItem(key, value); return true; } catch { return false; }
}

// A shared link (`?detail=ib`) wins for this view only; it never overwrites what the
// student chose for themselves.
export function getDetailLevel(win = window) {
  const fromUrl = new URLSearchParams(win.location.search).get(DETAIL_PARAM);
  if (isLevel(fromUrl)) return fromUrl;
  const stored = read(win, DETAIL_KEY);
  return isLevel(stored) ? stored : 'full';
}

// Saving a choice also drops any `detail` URL param, so a reload shows what they picked
// rather than snapping back to the shared link's level.
export function setDetailLevel(level, win = window) {
  if (!isLevel(level)) return;
  write(win, DETAIL_KEY, level);
  const params = new URLSearchParams(win.location.search);
  if (!params.has(DETAIL_PARAM)) return;
  params.delete(DETAIL_PARAM);
  const qs = params.toString();
  try {
    win.history.replaceState(null, '', `${win.location.pathname}${qs ? `?${qs}` : ''}${win.location.hash}`);
  } catch { /* history unavailable: the param just stays in the address bar */ }
}

// Unreadable storage counts as "seen": better to miss the tour than nag on every load.
export function hasSeenTour(win = window) {
  const v = read(win, TOUR_KEY);
  return v === undefined || v === '1';
}

// Returns whether the flag was actually saved.
export function markTourSeen(win = window) {
  return write(win, TOUR_KEY, '1');
}

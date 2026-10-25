import { getDetailLevel, setDetailLevel, hasSeenTour, markTourSeen } from '../lib/prefs.js';
import { mountDetailSettings } from './detailSettings.js';
import { startTour, mountReplayButton } from './tour.js';

// The shared extras every graph page gets: the detail-settings gear on the chart card, the
// bottom-left replay button, and the first-visit walkthrough. Each page supplies its own
// tour steps (built for the current detail level) and re-renders on a detail change.
export function initGraphChrome(doc, { chartHead, steps, onDetailChange }) {
  let detail = getDetailLevel();
  let tour = null;

  mountDetailSettings(chartHead, {
    level: detail,
    onChange(level) {
      setDetailLevel(level);
      detail = level;
      onDetailChange(level);
    },
  });

  const chrome = {
    getDetail: () => detail,
    startTour() {
      tour?.end();
      tour = startTour(doc, steps(detail), { onDone: () => { tour = null; } });
    },
  };

  mountReplayButton(doc, () => chrome.startTour());
  return chrome;
}

// Called by the page after its first render, so the tour's targets are laid out. Marked
// seen before it starts: a student who closes the tab mid-tour isn't shown it again. If the
// flag can't be saved (storage reads but won't write), skip it rather than nag every load.
export function maybeAutoStartTour(chrome, win = window) {
  if (hasSeenTour(win) || !markTourSeen(win)) return;
  chrome.startTour();
}

// The standard walkthrough for an intervention page (price ceiling, floor, tax, subsidy).
// The "tap a shaded area" step only appears when tapping actually does something.
export function interventionTourSteps({ policyName, sliderNoun, clickableRegions }, detail) {
  return [
    {
      target: '.toggle-row--primary',
      title: 'Turn the policy on and off.',
      text: `Flip this switch to impose the ${policyName} on the free market, and watch the graph change.`,
    },
    {
      target: '.sidebar',
      title: 'Drag anything.',
      text: `These sliders move the ${sliderNoun}, shift demand and supply, and change how steep the curves are. Everything updates live.`,
    },
    ...(clickableRegions && detail === 'full' ? [{
      target: '#chart',
      title: 'Tap a shaded area',
      text: 'to see what it means and how big it is.',
    }] : []),
    {
      target: '.detail-gear',
      title: 'Too busy? Change the detail.',
      text: 'This gear switches between full explanation and an IB-perfect exam diagram.',
    },
  ];
}

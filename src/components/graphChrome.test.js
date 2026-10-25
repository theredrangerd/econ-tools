import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initGraphChrome, maybeAutoStartTour, interventionTourSteps } from './graphChrome.js';

const ceilingTour = { policyName: 'price ceiling', sliderNoun: 'ceiling', clickableRegions: true };

function blockedWin() {
  const boom = () => { throw new Error('blocked'); };
  return { localStorage: { getItem: boom, setItem: boom }, location: { search: '' } };
}

describe('interventionTourSteps', () => {
  it('has four steps at full, naming the policy and the slider', () => {
    const steps = interventionTourSteps(ceilingTour, 'full');
    expect(steps.map((s) => s.target)).toEqual(['.toggle-row--primary', '.sidebar', '#chart', '.detail-gear']);
    expect(steps[0].text).toBe('Flip this switch to impose the price ceiling on the free market, and watch the graph change.');
    expect(steps[1].text).toBe('These sliders move the ceiling, shift demand and supply, and change how steep the curves are. Everything updates live.');
    expect(steps[3].title).toBe('Too busy? Change the detail.');
  });

  it('keeps the shaded-area step at every detail level, since regions stay clickable', () => {
    expect(interventionTourSteps(ceilingTour, 'ib').map((s) => s.target)).toContain('#chart');
    expect(interventionTourSteps(ceilingTour, 'clean')).toHaveLength(4);
  });

  it('drops the shaded-area step for a page without clickable regions', () => {
    expect(interventionTourSteps({ ...ceilingTour, clickableRegions: false }, 'full')).toHaveLength(3);
  });
});

describe('initGraphChrome', () => {
  let onDetailChange;
  const make = () => initGraphChrome(document, {
    chartHead: document.querySelector('.chart-head'),
    steps: (detail) => interventionTourSteps(ceilingTour, detail),
    onDetailChange,
  });
  const pick = (v) => {
    const r = document.querySelector(`input[name="detail-level"][value="${v}"]`);
    r.checked = true;
    r.dispatchEvent(new Event('change', { bubbles: true }));
  };

  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/');
    document.body.innerHTML = '<div class="chart-head"></div><div class="toggle-row--primary"></div><aside class="sidebar"></aside><svg id="chart"></svg>';
    onDetailChange = vi.fn();
  });

  it('mounts the gear and the replay button', () => {
    make();
    expect(document.querySelector('.chart-head .detail-gear')).not.toBeNull();
    expect(document.querySelector('.tour-replay')).not.toBeNull();
  });

  it('saves a new detail level and tells the page', () => {
    const chrome = make();
    expect(chrome.getDetail()).toBe('full');
    pick('ib');
    expect(onDetailChange).toHaveBeenCalledWith('ib');
    expect(chrome.getDetail()).toBe('ib');
    expect(localStorage.getItem('econ.detail')).toBe('ib');
  });

  it('auto-starts the tour once, marking it seen up front', () => {
    const chrome = make();
    maybeAutoStartTour(chrome);
    expect(document.querySelector('.tour-bubble').textContent).toContain('Step 1 of 4');
    expect(localStorage.getItem('econ.tourSeen')).toBe('1');
    document.querySelector('.tour-skip').click();
    maybeAutoStartTour(chrome);
    expect(document.querySelector('.tour-bubble')).toBeNull();
  });

  it('replay runs the tour again even after it was seen', () => {
    localStorage.setItem('econ.tourSeen', '1');
    make();
    document.querySelector('.tour-replay').click();
    expect(document.querySelector('.tour-bubble')).not.toBeNull();
  });

  it('replaying while a tour is open restarts it instead of stacking a second one', () => {
    const chrome = make();
    chrome.startTour();
    document.querySelector('.tour-next').click();
    chrome.startTour();
    expect(document.querySelectorAll('.tour-bubble')).toHaveLength(1);
    expect(document.querySelector('.tour-bubble').textContent).toContain('Step 1 of 4');
  });

  it('a first visit through a ?detail=ib link shows IB perfect and the full four-step tour', () => {
    history.replaceState(null, '', '/?detail=ib');
    const chrome = make();
    expect(document.querySelector('input[name="detail-level"][value="ib"]').checked).toBe(true);
    maybeAutoStartTour(chrome);
    expect(document.querySelector('.tour-bubble').textContent).toContain('Step 1 of 4');
  });

  it('does not auto-start when storage can be read but not written', () => {
    const chrome = make();
    const win = { localStorage: { getItem: () => null, setItem: () => { throw new Error('quota'); } }, location: { search: '' } };
    maybeAutoStartTour(chrome, win);
    expect(document.querySelector('.tour-bubble')).toBeNull();
  });

  it('does not auto-start when storage is blocked', () => {
    const chrome = make();
    maybeAutoStartTour(chrome, blockedWin());
    expect(document.querySelector('.tour-bubble')).toBeNull();
  });
});

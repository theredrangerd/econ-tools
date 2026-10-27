import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initPriceCeilingPage } from './price-ceiling.js';
import { initPriceFloorPage } from './price-floor.js';
import { initIndirectTaxPage } from './indirect-tax.js';
import { initSubsidyPage } from './subsidy.js';
import { initGraphChrome, interventionTourSteps } from '../components/graphChrome.js';

// Detail settings + walkthrough on every Government Intervention page, against the real markup.
const PAGES = [
  { file: 'price-ceiling.html', init: initPriceCeilingPage, toggle: '#ceiling-toggle', policy: 'impose the price ceiling' },
  { file: 'price-floor.html', init: initPriceFloorPage, toggle: '#floor-toggle', policy: 'impose the price floor' },
  { file: 'indirect-tax.html', init: initIndirectTaxPage, toggle: '#tax-toggle', policy: 'impose the tax' },
  { file: 'subsidy.html', init: initSubsidyPage, toggle: '#subsidy-toggle', policy: 'impose the subsidy' },
];

function loadPage(file) {
  const dir = dirname(fileURLToPath(import.meta.url));
  const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention', file), 'utf8');
  document.body.innerHTML = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
}

const pick = (v) => {
  const r = document.querySelector(`input[name="detail-level"][value="${v}"]`);
  r.checked = true;
  r.dispatchEvent(new Event('change', { bubbles: true }));
};

describe.each(PAGES)('$file: detail settings and walkthrough', ({ file, init, toggle, policy }) => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/');
    loadPage(file);
  });

  it('adds the gear to the chart head, the replay button, and a 4-step first-visit tour', () => {
    init(document);
    expect(document.querySelector('.chart-head .detail-gear')).not.toBeNull();
    expect(document.querySelector('.tour-replay')).not.toBeNull();
    const bubble = document.querySelector('.tour-bubble');
    expect(bubble.textContent).toContain('Step 1 of 4');
    expect(bubble.textContent).toContain(policy);
  });

  it('keeps IB perfect through the toggle and a slider drag', () => {
    localStorage.setItem('econ.detail', 'ib');
    init(document);
    const sw = document.querySelector(toggle);
    sw.checked = true;
    sw.dispatchEvent(new Event('change'));
    const slider = document.querySelector('#demand-slider');
    slider.value = '10';
    slider.dispatchEvent(new Event('input'));
    const chart = document.querySelector('#chart');
    expect(chart.dataset.detail).toBe('ib');
    expect(chart.querySelector('.region-badge')).toBeNull();
  });

  it('re-renders the chart when the detail level changes', () => {
    init(document);
    const chart = document.querySelector('#chart');
    expect(chart.dataset.detail).toBe('full');
    pick('clean');
    expect(chart.dataset.detail).toBe('clean');
  });
});

describe('price ceiling: changing detail closes an open explainer', () => {
  it('removes the popover when switching from full to clean', () => {
    localStorage.clear();
    localStorage.setItem('econ.tourSeen', '1');
    loadPage('price-ceiling.html');
    initPriceCeilingPage(document);
    document.querySelector('#chart [data-region="cs"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.querySelector('.region-popover')).not.toBeNull();
    pick('clean');
    expect(document.querySelector('.region-popover')).toBeNull();
  });
});

describe('graph chrome options', () => {
  const stepOpts = { policyName: 'subsidy', sliderNoun: 'subsidy', clickableRegions: true };

  it('detailSettings: false mounts no gear and reports the IB level', () => {
    localStorage.clear();
    document.body.innerHTML = '<div id="head"></div>';
    const chrome = initGraphChrome(document, {
      chartHead: document.getElementById('head'), steps: () => [], onDetailChange: () => {}, detailSettings: false,
    });
    expect(document.querySelector('.detail-gear')).toBeNull();
    expect(chrome.getDetail()).toBe('ib');
  });

  it('mounts the gear by default', () => {
    localStorage.clear();
    document.body.innerHTML = '<div id="head"></div>';
    initGraphChrome(document, { chartHead: document.getElementById('head'), steps: () => [], onDetailChange: () => {} });
    expect(document.querySelector('.detail-gear')).not.toBeNull();
  });

  it('viewSwitch: true ends the tour on the view switch instead of the gear', () => {
    const steps = interventionTourSteps({ ...stepOpts, viewSwitch: true });
    const last = steps[steps.length - 1];
    expect(last).toEqual({
      target: '.view-switch',
      title: 'Switch views.',
      text: 'IB perfect is the diagram to draw in an exam; Explorer lets you highlight one area at a time.',
    });
    expect(steps.some((s) => s.target === '.detail-gear')).toBe(false);
  });

  it('defaults still end the tour on the gear', () => {
    const steps = interventionTourSteps(stepOpts);
    expect(steps[steps.length - 1].target).toBe('.detail-gear');
  });
});

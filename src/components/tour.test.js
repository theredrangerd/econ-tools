import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startTour, mountReplayButton } from './tour.js';

function stubRect(el, rect) {
  el.getBoundingClientRect = () => ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top });
}

describe('startTour', () => {
  let onDone;
  const bubble = () => document.querySelector('.tour-bubble');
  const leftovers = () => document.querySelectorAll('.tour-bubble, .tour-backdrop, .tour-spotlight').length;

  beforeEach(() => {
    window.innerWidth = 1024;
    window.innerHeight = 768;
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    stubRect(document.querySelector('#a'), { left: 100, top: 100, width: 200, height: 40 });
    stubRect(document.querySelector('#b'), { left: 400, top: 300, width: 200, height: 40 });
    onDone = vi.fn();
  });

  const steps = [
    { target: '#a', title: 'First thing.', text: 'Do the first thing.' },
    { target: '#b', title: 'Second thing.', text: 'Do the second thing.' },
  ];

  it('walks through the steps and cleans up on Got it', () => {
    startTour(document, steps, { onDone });
    expect(bubble().textContent).toContain('Step 1 of 2');
    expect(bubble().textContent).toContain('First thing.');
    expect(bubble().getAttribute('role')).toBe('dialog');
    bubble().querySelector('.tour-next').click();
    expect(bubble().textContent).toContain('Step 2 of 2');
    expect(bubble().querySelector('.tour-next').textContent).toBe('Got it');
    expect(bubble().querySelector('.tour-skip')).toBeNull();
    bubble().querySelector('.tour-next').click();
    expect(leftovers()).toBe(0);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('drops steps whose target is missing', () => {
    startTour(document, [steps[0], { target: '#nope', title: 'x', text: 'y' }, steps[1]], { onDone });
    expect(bubble().textContent).toContain('Step 1 of 2');
  });

  it('calls onDone straight away when no target resolves', () => {
    startTour(document, [{ target: '#nope', title: 'x', text: 'y' }], { onDone });
    expect(bubble()).toBeNull();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('Skip tour removes everything', () => {
    startTour(document, steps, { onDone });
    bubble().querySelector('.tour-skip').click();
    expect(leftovers()).toBe(0);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('Escape skips the tour, and only once', () => {
    startTour(document, steps, { onDone });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(leftovers()).toBe(0);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('end() tears the tour down', () => {
    const tour = startTour(document, steps, { onDone });
    tour.end();
    expect(leftovers()).toBe(0);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('keeps the bubble inside the viewport for a target in the bottom-right corner', () => {
    const corner = document.querySelector('#a');
    stubRect(corner, { left: 1000, top: 740, width: 40, height: 20 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return this.classList?.contains('tour-bubble') ? 280 : 0; } });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return this.classList?.contains('tour-bubble') ? 140 : 0; } });
    try {
      startTour(document, [{ target: corner, title: 't', text: 'x' }]);
      const left = parseFloat(bubble().style.left);
      const top = parseFloat(bubble().style.top);
      expect(left + 280).toBeLessThanOrEqual(1024 - 12);
      expect(top).toBeGreaterThanOrEqual(12);
      expect(top + 140).toBeLessThanOrEqual(768 - 12);
    } finally {
      delete HTMLElement.prototype.offsetWidth;
      delete HTMLElement.prototype.offsetHeight;
    }
  });
});

describe('mountReplayButton', () => {
  it('adds a Replay tour button to the body that calls back on click', () => {
    document.body.innerHTML = '';
    const fn = vi.fn();
    const btn = mountReplayButton(document, fn);
    expect(btn.parentElement).toBe(document.body);
    expect(btn.classList.contains('tour-replay')).toBe(true);
    expect(btn.textContent).toContain('Replay tour');
    btn.click();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

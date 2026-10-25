import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountDetailSettings } from './detailSettings.js';

describe('mountDetailSettings', () => {
  let head, onChange, ctl;
  const popover = () => document.querySelector('#detail-popover');
  const radio = (v) => document.querySelector(`input[name="detail-level"][value="${v}"]`);

  beforeEach(() => {
    document.body.innerHTML = '<div class="chart-head"><span id="status-pill"></span></div>';
    head = document.querySelector('.chart-head');
    onChange = vi.fn();
    ctl = mountDetailSettings(head, { level: 'clean', onChange });
  });

  it('adds a closed gear after the status pill with the current level checked', () => {
    expect(head.lastElementChild.classList.contains('detail-gear') || head.querySelector('.detail-gear')).toBeTruthy();
    expect(head.querySelector('#status-pill').nextElementSibling.classList.contains('detail-gear')).toBe(true);
    expect(ctl.gear.getAttribute('aria-expanded')).toBe('false');
    expect(popover().hidden).toBe(true);
    expect(radio('clean').checked).toBe(true);
  });

  it('labels the three levels in order', () => {
    const labels = [...popover().querySelectorAll('label')].map((l) => l.textContent.trim());
    expect(labels).toEqual(['Full explanation', 'Clean', 'IB perfect']);
    expect(popover().textContent).toContain('IB perfect = exactly what an exam diagram needs.');
  });

  it('opens on click and reports a new level, staying open', () => {
    ctl.gear.click();
    expect(popover().hidden).toBe(false);
    expect(ctl.gear.getAttribute('aria-expanded')).toBe('true');
    radio('ib').checked = true;
    radio('ib').dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenCalledWith('ib');
    expect(popover().hidden).toBe(false);
  });

  it('closes on Escape', () => {
    ctl.gear.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(popover().hidden).toBe(true);
    expect(ctl.gear.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on a click outside the gear and popover, but not inside it', () => {
    ctl.gear.click();
    radio('full').click();
    expect(popover().hidden).toBe(false);
    document.body.click();
    expect(popover().hidden).toBe(true);
  });

  it('setLevel checks the matching radio', () => {
    ctl.setLevel('full');
    expect(radio('full').checked).toBe(true);
  });
});

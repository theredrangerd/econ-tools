// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { mountModeSwitch } from './modeSwitch.js';

function setup(mode = 'explain') {
  document.body.innerHTML = '<div class="chart-head"></div>';
  const onChange = vi.fn();
  const api = mountModeSwitch(document.querySelector('.chart-head'), { mode, onChange });
  return { api, onChange };
}

describe('mountModeSwitch', () => {
  it('renders Explain and Play radios with the current one checked', () => {
    setup('explain');
    const radios = [...document.querySelectorAll('input[name="page-mode"]')];
    expect(radios.map((r) => r.value)).toEqual(['explain', 'play']);
    expect(radios.map((r) => r.checked)).toEqual([true, false]);
  });

  it('calls onChange("play") when Play is clicked', () => {
    const { onChange } = setup();
    document.querySelector('input[value="play"]').click();
    expect(onChange).toHaveBeenCalledWith('play');
  });

  it('setMode updates the checked radio without firing onChange', () => {
    const { api, onChange } = setup();
    api.setMode('play');
    expect(document.querySelector('input[value="play"]').checked).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { resolveUnitName, initWipPage } from './wip.js';
import { getUnits } from '../lib/units.js';

describe('resolveUnitName', () => {
  it('resolves a known unit slug to its display name', () => {
    expect(resolveUnitName('?unit=microeconomics', getUnits())).toBe('Microeconomics');
  });

  it('falls back to a generic label when the unit param is missing', () => {
    expect(resolveUnitName('', getUnits())).toBe('This section');
  });

  it('falls back to a generic label when the unit param does not match any known unit', () => {
    expect(resolveUnitName('?unit=not-a-real-unit', getUnits())).toBe('This section');
  });
});

describe('initWipPage', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="mini-header"></div>
      <h1 id="wip-title"></h1>
      <iframe id="feedback-form"></iframe>
    `;
  });

  it('shows the resolved unit name in the title and embeds the feedback form', () => {
    initWipPage(document, { search: '?unit=development' });
    expect(document.querySelector('#wip-title').textContent).toBe('Development Economics is coming soon');
    expect(document.querySelector('#feedback-form').src).toContain(
      'docs.google.com/forms/d/e/1FAIpQLSc4hUwcytl1QE3H1Iod7Ag8SRmmgDdEAPJED37kbj-ZB2O7yQ'
    );
  });

  it('degrades gracefully with a generic title when the unit param is unknown', () => {
    initWipPage(document, { search: '?unit=bogus' });
    expect(document.querySelector('#wip-title').textContent).toBe('This section is coming soon');
  });

  it('degrades gracefully with a generic title when there is no unit param at all', () => {
    initWipPage(document, { search: '' });
    expect(document.querySelector('#wip-title').textContent).toBe('This section is coming soon');
  });
});

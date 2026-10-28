import { describe, it, expect } from 'vitest';
import { SUBSIDY_STEPS } from './subsidyExplainSteps.js';
import { LAYERS } from '../lib/marketChart.js';

const ctx = { amount: 20, result: { Q: 55.5, govCost: 1110 } };

describe('SUBSIDY_STEPS', () => {
  it('has the 11 steps in order', () => {
    expect(SUBSIDY_STEPS.map((s) => s.id)).toEqual([
      'demand', 'supply', 'subsidy', 'equilibrium', 'prices', 'producer',
      'consumer', 'overlap', 'government', 'welfare', 'wrap']);
  });
  it('never drops supply (S1 never moves) before the IB wrap-up', () => {
    SUBSIDY_STEPS.slice(1, 10).forEach((s) => expect(s.layers).toContain('supply'));
    expect(SUBSIDY_STEPS[10].view).toBe('ib');
    expect(SUBSIDY_STEPS[10].finish).toBe(true);
  });
  it('only uses known layer names, and enter is a subset of layers', () => {
    SUBSIDY_STEPS.forEach((s) => {
      (s.layers ?? []).forEach((n) => expect(LAYERS).toContain(n));
      (s.enter ?? []).forEach((n) => expect(s.layers).toContain(n));
    });
  });
  it('captions the government bracket on step 3', () => {
    expect(SUBSIDY_STEPS[2].captions(ctx)).toMatchObject({ bracket: '$20 paid by government' });
  });
  it('steps 1-2 have no subsidy, 3-11 have slider and subsidy', () => {
    expect(SUBSIDY_STEPS.slice(0, 2).every((s) => s.subsidy === false && s.slider === false)).toBe(true);
    expect(SUBSIDY_STEPS.slice(2).every((s) => s.subsidy && s.slider)).toBe(true);
  });
  it('uses live values in steps 4 and 9', () => {
    expect(SUBSIDY_STEPS[3].text(ctx)).toContain('55.5');
    expect(SUBSIDY_STEPS[8].text(ctx)).toContain('$1,110');
  });
});

import { describe, it, expect } from 'vitest';
import { computeMarket } from './marketEngine.js';

const base = { demand: 140, supply: 20, slopeD: 1, slopeS: 1 };

describe('computeMarket — free market', () => {
  it('clears at the textbook equilibrium with no deadweight loss', () => {
    const r = computeMarket({ ...base, intervention: { type: 'none' } });
    expect(r.mode).toBe('free');
    expect(r.Q).toBe(60);
    expect(r.Pc).toBe(80);
    expect(r.Pp).toBe(80);
    expect(r.CS).toBe(1800);
    expect(r.PS).toBe(1800);
    expect(r.DWL).toBe(0);
  });

  it('short-circuits to noTrade with zero surplus when demand never exceeds supply', () => {
    const r = computeMarket({ demand: 10, supply: 50, slopeD: 1, slopeS: 1, intervention: { type: 'none' } });
    expect(r.noTrade).toBe(true);
    expect(r.CS).toBe(0);
    expect(r.PS).toBe(0);
    expect(r.DWL).toBe(0);
  });
});

describe('computeMarket — price ceiling', () => {
  it('rations quantity down to the shorter side of the market when binding', () => {
    const r = computeMarket({ ...base, intervention: { type: 'ceiling', price: 50 } });
    expect(r.mode).toBe('ceiling');
    expect(r.Q).toBe(30);
    expect(r.Pc).toBe(50);
    expect(r.Pp).toBe(50);
    expect(r.gap).toBe(60);
    expect(r.CS).toBe(2250);
    expect(r.PS).toBe(450);
    expect(r.DWL).toBe(900);
  });

  it('falls back to the free-market result when the ceiling is set above equilibrium', () => {
    const r = computeMarket({ ...base, intervention: { type: 'ceiling', price: 100 } });
    expect(r.mode).toBe('free');
    expect(r.Q).toBe(60);
    expect(r.DWL).toBe(0);
  });

  it('short-circuits to noTrade even with a ceiling active, instead of dividing by a meaningless denominator', () => {
    const r = computeMarket({ demand: 10, supply: 50, slopeD: 1, slopeS: 1, intervention: { type: 'ceiling', price: 5 } });
    expect(r.noTrade).toBe(true);
    expect(r.DWL).toBe(0);
  });

  it('reports the true shortage even when demanded quantity would exceed QMAX at an extreme ceiling price', () => {
    const r = computeMarket({ ...base, intervention: { type: 'ceiling', price: 30 } });
    expect(r.gap).toBe(100);
  });

  it('carries the requested control price through even when the ceiling does not bind, so the UI can still show a reference line', () => {
    const r = computeMarket({ ...base, intervention: { type: 'ceiling', price: 100 } });
    expect(r.mode).toBe('free');
    expect(r.requestedControl).toEqual({ type: 'ceiling', price: 100 });
  });

  it('has no requestedControl when no intervention is requested', () => {
    const r = computeMarket({ ...base, intervention: { type: 'none' } });
    expect(r.requestedControl).toBeNull();
  });
});

describe('computeMarket — price floor', () => {
  it('rations quantity down to the shorter side of the market when binding', () => {
    const r = computeMarket({ ...base, intervention: { type: 'floor', price: 110 } });
    expect(r.mode).toBe('floor');
    expect(r.Q).toBe(30);
    expect(r.Pc).toBe(110);
    expect(r.Pp).toBe(110);
    expect(r.gap).toBe(60);
    expect(r.CS).toBe(450);
    expect(r.PS).toBe(2250);
    expect(r.DWL).toBe(900);
  });

  it('falls back to the free-market result when the floor is set below equilibrium', () => {
    const r = computeMarket({ ...base, intervention: { type: 'floor', price: 50 } });
    expect(r.mode).toBe('free');
    expect(r.Q).toBe(60);
    expect(r.DWL).toBe(0);
  });
});

describe('computeMarket — specific (per-unit) tax', () => {
  it('opens a wedge between what consumers pay and producers receive', () => {
    const r = computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 20 } });
    expect(r.mode).toBe('tax');
    expect(r.Q).toBe(50);
    expect(r.Pc).toBe(90);
    expect(r.Pp).toBe(70);
    expect(r.govRevenue).toBe(1000);
  });

  it('short-circuits to noTrade instead of computing a nonsense quantity', () => {
    const r = computeMarket({ demand: 10, supply: 50, slopeD: 1, slopeS: 1, intervention: { type: 'tax', mode: 'specific', amount: 20 } });
    expect(r.noTrade).toBe(true);
    expect(r.govRevenue).toBe(0);
  });
});

describe('computeMarket — ad valorem tax', () => {
  it('opens a proportional wedge based on the rate', () => {
    const r = computeMarket({ ...base, intervention: { type: 'tax', mode: 'advalorem', rate: 0.5 } });
    expect(r.mode).toBe('tax');
    expect(r.Q).toBe(44);
    expect(r.Pp).toBe(64);
    expect(r.Pc).toBe(96);
    expect(r.govRevenue).toBe(1408);
  });

  it('degenerates to the free-market result at a 0% rate', () => {
    const r = computeMarket({ ...base, intervention: { type: 'tax', mode: 'advalorem', rate: 0 } });
    expect(r.Q).toBe(60);
    expect(r.Pc).toBe(80);
    expect(r.Pp).toBe(80);
    expect(r.govRevenue).toBe(0);
  });
});

describe('computeMarket — subsidy', () => {
  it('widens the wedge the other way, increasing quantity above equilibrium', () => {
    const r = computeMarket({ ...base, intervention: { type: 'subsidy', amount: 20 } });
    expect(r.mode).toBe('subsidy');
    expect(r.Q).toBe(70);
    expect(r.Pc).toBe(70);
    expect(r.Pp).toBe(90);
    expect(r.govCost).toBe(1400);
    expect(r.DWL).toBeGreaterThan(0);
  });

  it('short-circuits to noTrade instead of computing a nonsense quantity', () => {
    const r = computeMarket({ demand: 10, supply: 50, slopeD: 1, slopeS: 1, intervention: { type: 'subsidy', amount: 20 } });
    expect(r.noTrade).toBe(true);
    expect(r.govCost).toBe(0);
  });
});

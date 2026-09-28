import { describe, it, expect } from 'vitest';
import { readCurveParams, guardSliders, marketFits, elasticityInfoHref } from './pageControls.js';
import { computeMarket, pointElasticities } from './marketEngine.js';

function slider(value, { min = -50, max = 50, step = 1 } = {}) {
  const input = document.createElement('input');
  input.type = 'range';
  Object.assign(input, { min: String(min), max: String(max), step: String(step), value: String(value) });
  return input;
}

function sliders(d, s, ed, es) {
  return {
    demandSlider: slider(d), supplySlider: slider(s),
    slopeDSlider: slider(ed, { min: -0.5, max: 0.5, step: 0.05 }),
    slopeSSlider: slider(es, { min: -0.5, max: 0.5, step: 0.05 }),
  };
}

const range = (lo, hi, step) => Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => +(lo + i * step).toFixed(4));
const SHIFTS = range(-50, 50, 10);
const ELAST = range(-0.5, 0.5, 0.05);

describe('readCurveParams', () => {
  it('maps the default sliders to a market that is unit elastic at P* 80, Q* 60', () => {
    const { market } = readCurveParams(sliders(0, 0, 0, 0));
    expect(market.demand).toBeCloseTo(160);
    expect(market.supply).toBeCloseTo(0);
    const r = computeMarket(market);
    expect(r.Qstar).toBeCloseTo(60);
    expect(r.Pstar).toBeCloseTo(80);
    const { ped, pes } = pointElasticities(r);
    expect(ped).toBeCloseTo(1);
    expect(pes).toBeCloseTo(1);
  });

  it('keeps both readouts at unit elastic when only demand is shifted', () => {
    for (const d of [-30, -10, 10, 30]) {
      const { ped, pes } = pointElasticities(computeMarket(readCurveParams(sliders(d, 0, 0, 0)).market));
      expect(ped).toBeCloseTo(1);
      expect(pes).toBeCloseTo(1);
    }
  });

  it('moves supply right (more supply) when the supply slider is dragged right', () => {
    const before = computeMarket(readCurveParams(sliders(0, 0, 0, 0)).market);
    const after = computeMarket(readCurveParams(sliders(0, 10, 0, 0)).market);
    expect(after.Qstar).toBeGreaterThan(before.Qstar);
    expect(after.Pstar).toBeLessThan(before.Pstar);
  });

  it('keeps the equilibrium fixed when only elasticity changes at zero shift', () => {
    const r = computeMarket(readCurveParams(sliders(0, 0, 0.5, -0.5)).market);
    expect(r.Qstar).toBeCloseTo(60);
    expect(r.Pstar).toBeCloseTo(80);
  });
});

describe('elasticity sliders across every reachable state', () => {
  it('always raise the displayed point elasticity when dragged right', () => {
    for (const d of SHIFTS) for (const s of SHIFTS) {
      for (const other of ELAST) {
        let prevD = -Infinity, prevS = -Infinity;
        for (const e of ELAST) {
          const rd = computeMarket(readCurveParams(sliders(d, s, e, other)).market);
          const rs = computeMarket(readCurveParams(sliders(d, s, other, e)).market);
          const { ped } = pointElasticities(rd);
          const { pes } = pointElasticities(rs);
          if (ped != null) { expect(ped).toBeGreaterThan(prevD); prevD = ped; }
          if (pes != null) { expect(pes).toBeGreaterThan(prevS); prevS = pes; }
        }
      }
    }
  });
});

describe('every state the guard accepts is internally consistent', () => {
  const interventions = [
    null,
    { type: 'ceiling', price: 50 },
    { type: 'floor', price: 110 },
    { type: 'tax', mode: 'specific', amount: 60 },
    { type: 'tax', mode: 'advalorem', rate: 1 },
    { type: 'subsidy', amount: 60 },
  ];
  it('keeps equilibria on both curves and incidence non-negative', () => {
    for (const d of SHIFTS) for (const s of SHIFTS) for (const ed of ELAST) for (const es of ELAST) {
      const { market } = readCurveParams(sliders(d, s, ed, es));
      for (const intervention of interventions) {
        const tweakable = intervention && (intervention.type === 'tax' || intervention.type === 'subsidy');
        if (!marketFits(market, tweakable ? intervention : null)) continue;
        const r = computeMarket({ ...market, intervention: intervention ?? { type: 'none' } });
        if (r.noTrade) continue;
        expect(Math.abs(r.Pd(r.Qstar) - r.Ps(r.Qstar))).toBeLessThan(1e-9);
        if (r.mode === 'tax' || r.mode === 'subsidy') {
          expect(r.consumerIncidence).toBeGreaterThanOrEqual(-1e-9);
          expect(r.producerIncidence).toBeGreaterThanOrEqual(-1e-9);
        }
        if (r.mode !== 'free') expect(r.DWL).toBeGreaterThanOrEqual(0);
        // no surplus region ever dips below a $0 price
        for (const poly of [r.psPoly, r.dwlPoly].filter(Boolean)) {
          expect(Math.min(...poly.map(([, p]) => p))).toBeGreaterThanOrEqual(-1e-9);
        }
      }
    }
  });
});

describe('guardSliders', () => {
  it('stops an input at the furthest valid step instead of the invalid target', () => {
    const input = slider(0, { min: 0, max: 10, step: 1 });
    guardSliders([input], () => +input.value <= 6);
    input.value = '9';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('6');
  });

  it('leaves a valid move untouched', () => {
    const input = slider(0, { min: 0, max: 10, step: 1 });
    guardSliders([input], () => true);
    input.value = '9';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('9');
  });
});

describe('elasticityInfoHref', () => {
  it('routes to the Elasticity family, which is the shared WIP stub until that family is built', () => {
    expect(elasticityInfoHref()).toMatch(/units\/wip\.html\?unit=elasticity$/);
  });
});

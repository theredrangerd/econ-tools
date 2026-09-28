import { describe, it, expect } from 'vitest';
import { fmtMoney, fmtPrice, fmtQty, elasticityLabel, fmtShift } from './format.js';

describe('fmtMoney', () => {
  it('rounds to whole dollars with a thousands separator', () => {
    expect(fmtMoney(1800)).toBe('$1,800');
    expect(fmtMoney(0)).toBe('$0');
  });
});

describe('fmtPrice', () => {
  it('shows exactly two decimal places', () => {
    expect(fmtPrice(80)).toBe('$80.00');
    expect(fmtPrice(96)).toBe('$96.00');
  });
});

describe('fmtQty', () => {
  it('shows exactly one decimal place', () => {
    expect(fmtQty(60)).toBe('60.0');
    expect(fmtQty(44)).toBe('44.0');
  });
});

describe('elasticityLabel', () => {
  it('classifies a real elasticity value against 1', () => {
    expect(elasticityLabel(4 / 3)).toBe('1.33 · elastic');
    expect(elasticityLabel(0.42)).toBe('0.42 · inelastic');
    expect(elasticityLabel(1.001)).toBe('1.00 · unit elastic');
    expect(elasticityLabel(null)).toBe('—');
  });
});

describe('fmtShift', () => {
  it('shows a signed offset', () => {
    expect(fmtShift(10)).toBe('+10');
    expect(fmtShift(-10)).toBe('−10');
    expect(fmtShift(0)).toBe('0');
  });
});

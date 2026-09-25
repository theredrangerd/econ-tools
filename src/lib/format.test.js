import { describe, it, expect } from 'vitest';
import { fmtMoney, fmtPrice, fmtQty } from './format.js';

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

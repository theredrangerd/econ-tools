import { describe, it, expect } from 'vitest';
import { getFamilyNav } from './familyNav.js';

describe('getFamilyNav', () => {
  it('returns the family href/name so callers can wire it into a mini-header back button', () => {
    const result = getFamilyNav('price-ceiling');
    expect(result.backHref).toBe('/units/microeconomics/government-intervention.html');
    expect(result.backLabel).toBe('Government Intervention');
  });

  it('returns one sibling per diagram in the family, marking the current one', () => {
    const { siblings } = getFamilyNav('price-ceiling');
    expect(siblings.length).toBeGreaterThan(1);
    expect(siblings.filter((s) => s.current)).toHaveLength(1);
    expect(siblings.find((s) => s.current).name).toBe('Price ceiling');
  });
});

import { describe, it, expect } from 'vitest';
import { getUnits, unitHref } from './units.js';

describe('getUnits', () => {
  it('returns all four IB syllabus units with their fixed tiers', () => {
    const units = getUnits();
    expect(units).toHaveLength(4);
    const tiers = Object.fromEntries(units.map((u) => [u.slug, u.tier]));
    expect(tiers.microeconomics).toBe('large');
    expect(tiers.macroeconomics).toBe('medium');
    expect(tiers.international).toBe('small');
    expect(tiers.development).toBe('small');
  });

  it('gives every unit a name and at least one search tag', () => {
    getUnits().forEach((unit) => {
      expect(typeof unit.name).toBe('string');
      expect(unit.name.length).toBeGreaterThan(0);
      expect(Array.isArray(unit.tags)).toBe(true);
      expect(unit.tags.length).toBeGreaterThan(0);
    });
  });
});

describe('unitHref', () => {
  it('points to the generic work-in-progress stub with the unit slug as a query param', () => {
    expect(unitHref({ slug: 'microeconomics' })).toBe('/units/wip.html?unit=microeconomics');
  });
});

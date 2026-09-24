import { describe, it, expect } from 'vitest';
import { filterGraphs } from './search.js';

const fixture = [
  { name: 'Microeconomics', tags: ['supply', 'demand', 'minimum wage'] },
  { name: 'Macroeconomics', tags: ['aggregate demand', 'aggregate supply', 'business cycle'] },
  { name: 'International Economics', tags: ['tariffs', 'trade'] },
];

describe('filterGraphs', () => {
  it('returns all items when the query is empty or whitespace-only', () => {
    expect(filterGraphs('', fixture)).toEqual(fixture);
    expect(filterGraphs('   ', fixture)).toEqual(fixture);
  });

  it('matches case-insensitively', () => {
    expect(filterGraphs('MICROECONOMICS', fixture)).toEqual([fixture[0]]);
  });

  it('matches a partial word inside a tag, not just the item name', () => {
    expect(filterGraphs('wage', fixture)).toEqual([fixture[0]]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterGraphs('nonexistent topic', fixture)).toEqual([]);
  });
});

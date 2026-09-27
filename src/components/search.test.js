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

  it('matches a tag nested under a unit\'s families/diagrams, not just top-level tags', () => {
    const nested = [
      {
        name: 'Microeconomics',
        tags: ['supply', 'demand'],
        families: [
          {
            name: 'Government Intervention',
            diagrams: [
              { name: 'Subsidy', tags: ['subsidy', 'government spending'] },
              { name: 'Indirect tax', tags: ['deadweight loss'] },
            ],
          },
        ],
      },
      { name: 'Macroeconomics', tags: ['aggregate demand', 'aggregate supply', 'business cycle'] },
    ];
    expect(filterGraphs('subsidy', nested)).toEqual([nested[0]]);
    expect(filterGraphs('deadweight loss', nested)).toEqual([nested[0]]);
  });

  it('does not crash on a unit with no families property', () => {
    const nested = [
      { name: 'Macroeconomics', tags: ['aggregate demand', 'aggregate supply', 'business cycle'] },
    ];
    expect(filterGraphs('aggregate demand', nested)).toEqual(nested);
    expect(filterGraphs('nothing-matches-here', nested)).toEqual([]);
  });
});

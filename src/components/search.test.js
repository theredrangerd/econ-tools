import { describe, it, expect } from 'vitest';
import { filterGraphs, matchGraphs } from './search.js';

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

describe('matchGraphs', () => {
  const units = [
    {
      name: 'Microeconomics',
      tags: ['supply', 'demand'],
      families: [
        {
          name: 'Government Intervention',
          diagrams: [
            { name: 'Subsidy', level: 'SL', tags: ['subsidy', 'government spending'] },
            { name: 'Indirect tax', level: 'SL', tags: ['deadweight loss'] },
          ],
        },
        {
          name: 'Market Failure',
          diagrams: [{ name: 'Public goods', level: 'SL', tags: ['free rider'] }],
        },
      ],
    },
    { name: 'Macroeconomics', tags: ['aggregate demand', 'business cycle'] },
  ];

  it('returns null for an empty or whitespace-only query', () => {
    expect(matchGraphs('', units)).toBeNull();
    expect(matchGraphs('   ', units)).toBeNull();
  });

  it('returns an empty array when nothing matches', () => {
    expect(matchGraphs('nonexistent topic', units)).toEqual([]);
  });

  it('groups a diagram-level match under its unit, with the matched diagram as a chip', () => {
    const results = matchGraphs('subsidy', units);
    expect(results).toHaveLength(1);
    expect(results[0].unit.name).toBe('Microeconomics');
    expect(results[0].matches).toHaveLength(1);
    expect(results[0].matches[0]).toMatchObject({
      kind: 'diagram',
      label: 'Subsidy',
      level: 'SL',
      context: 'Government Intervention',
    });
  });

  it('groups a family-level match as its own chip, without a diagram context', () => {
    const results = matchGraphs('government intervention', units);
    expect(results).toHaveLength(1);
    expect(results[0].matches[0]).toMatchObject({ kind: 'family', label: 'Government Intervention' });
  });

  it('includes the unit with no chips when only the unit itself matches', () => {
    const results = matchGraphs('macroeconomics', units);
    expect(results).toHaveLength(1);
    expect(results[0].unit.name).toBe('Macroeconomics');
    expect(results[0].matches).toEqual([]);
  });
});

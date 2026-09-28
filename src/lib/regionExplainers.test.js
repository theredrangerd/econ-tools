import { describe, it, expect } from 'vitest';
import { REGION_INFO } from './regionExplainers.js';

describe('REGION_INFO wording', () => {
  it('does not equate too little trade with a shortage (a tax or floor causes no shortage)', () => {
    expect(REGION_INFO.dwl.text).not.toMatch(/shortage/i);
    expect(REGION_INFO.dwl.text).toMatch(/tax/);
  });

  it('places the floor gap at the floor price and calls it excess supply', () => {
    expect(REGION_INFO.floor.text).not.toMatch(/below it/);
    expect(REGION_INFO.floor.text).toMatch(/excess supply/);
    expect(REGION_INFO.ceiling.text).not.toMatch(/below it/);
  });

  it('explains the shortage and excess-supply brackets', () => {
    expect(REGION_INFO.shortage.text).toMatch(/Qd − Qs/);
    expect(REGION_INFO['excess-supply'].text).toMatch(/not the same thing as producer surplus/);
  });
});

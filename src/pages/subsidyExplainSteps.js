// The 11-step Explain walkthrough for the subsidy page. Each step's `layers` is the complete
// set drawn at that step (not a diff); `enter` lists the layers that fade in on it.
import { fmtMoney, fmtQty } from '../lib/format.js';

const L1 = ['demand'];
const L2 = [...L1, 'supply', 'eq1'];
const L3 = [...L2, 'supply2', 'subsidyBracket'];
const L4 = [...L3, 'eq2'];
const L5 = [...L4, 'prices'];
const L6 = [...L5.filter((n) => n !== 'subsidyBracket'), 'psTriangle', 'marginalPs'];
const L7 = [...L6, 'csTriangle', 'marginalCs'];
const L8 = [...L7.filter((n) => !['csTriangle', 'psTriangle', 'marginalCs', 'marginalPs'].includes(n)), 'cs', 'ps', 'overlap'];
const L9 = [...L7, 'wedgeBox'];
const L10 = [...L9, 'dwl'];

const S1 = 'S1 = what it costs to make';
const S2 = 'S2 = what customers need to pay';

const s1Only = () => ({ s1: S1 });
const s1s2 = () => ({ s1: S1, s2: S2 });
const withBracket = ({ amount }) => ({ s1: S1, s2: S2, bracket: `${fmtMoney(amount)} paid by government` });

export const SUBSIDY_STEPS = [
  {
    id: 'demand', headline: () => 'Demand',
    text: () => 'This is demand: how many loaves people want to buy at each price. Lower price, more loaves.',
    slider: false, subsidy: false, layers: L1, enter: ['demand'],
  },
  {
    id: 'supply', headline: () => 'Supply',
    text: () => 'This is supply: what it costs the bakery to bake each extra loaf. Where it meets demand is the market price, Pe.',
    slider: false, subsidy: false, layers: L2, enter: ['supply', 'eq1'], captions: s1Only,
  },
  {
    id: 'subsidy', headline: () => 'The bakery’s costs don’t change, so S1 stays put.',
    text: ({ amount }) => `The government pays ${fmtMoney(amount)} per loaf, so the bakery needs ${fmtMoney(amount)} less from each customer. That’s S2.`,
    slider: true, subsidy: true, layers: L3, enter: ['supply2', 'subsidyBracket'], captions: withBracket,
  },
  {
    id: 'equilibrium', headline: () => 'A new equilibrium',
    text: ({ result }) => `More loaves are sold, Q₁ (${fmtQty(result.Q)}) instead of Qe, because customers pay less.`,
    slider: true, subsidy: true, layers: L4, enter: ['eq2'], captions: withBracket,
  },
  {
    id: 'prices', headline: () => 'Two prices',
    text: ({ amount }) => `Customers pay Pc. The bakery receives Pp: what the customer pays plus ${fmtMoney(amount)} from the government.`,
    slider: true, subsidy: true, layers: L5, enter: ['prices'], captions: withBracket,
  },
  {
    id: 'producer', headline: () => 'Producer surplus shifts',
    text: () => 'Producers gain this extra band: they now receive Pp instead of Pe.',
    slider: true, subsidy: true, layers: L6, enter: ['psTriangle', 'marginalPs'], grow: ['marginalPs'], captions: s1s2,
  },
  {
    id: 'consumer', headline: () => 'Consumer surplus shifts',
    text: () => 'Consumers gain this band: they now pay Pc instead of Pe.',
    slider: true, subsidy: true, layers: L7, enter: ['csTriangle', 'marginalCs'], grow: ['marginalCs'], captions: s1s2,
  },
  {
    id: 'overlap', headline: () => 'Notice the overlap',
    text: () => 'Look: part of the area is counted as both consumer <em>and</em> producer surplus. It’s the same money, and the government pays for it.',
    slider: true, subsidy: true, layers: L8, enter: ['cs', 'ps', 'overlap'], captions: s1s2,
  },
  {
    id: 'government', headline: () => 'Government spending',
    text: ({ amount, result }) => `The government pays ${fmtMoney(amount)} × Q₁ in total (${fmtMoney(result.govCost)}). That’s this whole box: the consumers’ gain, the producers’ gain, plus one more piece…`,
    slider: true, subsidy: true, layers: L9, enter: ['wedgeBox'], captions: s1s2,
  },
  {
    id: 'welfare', headline: () => 'Welfare loss',
    text: () => '…this triangle. Those last loaves cost more to make (S1) than buyers value them (D), so society loses this much.',
    slider: true, subsidy: true, layers: L10, enter: ['dwl'], captions: s1s2,
  },
  {
    id: 'wrap', headline: () => 'The full diagram',
    text: () => 'That’s the full subsidy diagram, the one you’d draw in an exam.',
    slider: true, subsidy: true, layers: [], view: 'ib', finish: true,
  },
];

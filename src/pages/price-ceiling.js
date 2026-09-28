import { fmtQty } from '../lib/format.js';
import { initPriceControlPage } from './price-control.js';

export function initPriceCeilingPage(doc) {
  initPriceControlPage(doc, {
    slug: 'price-ceiling',
    title: 'Price ceiling',
    type: 'ceiling',
    bindingPill: 'Price ceiling binding',
    gapNote: (gap) => `<strong>${fmtQty(gap)} units of shortage.</strong> Buyers want more than sellers are willing to provide at this price — expect queues or rationing.`,
    notBindingNote: '<strong>Not binding.</strong> This ceiling is set above the equilibrium price, so it has no effect — the market clears exactly as it would without it.',
  });
}

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        wip: 'units/wip.html',
        microeconomics: 'units/microeconomics.html',
        governmentIntervention: 'units/microeconomics/government-intervention.html',
        priceCeiling: 'units/microeconomics/government-intervention/price-ceiling.html',
        priceFloor: 'units/microeconomics/government-intervention/price-floor.html',
        indirectTax: 'units/microeconomics/government-intervention/indirect-tax.html',
        subsidy: 'units/microeconomics/government-intervention/subsidy.html',
      },
    },
  },
});

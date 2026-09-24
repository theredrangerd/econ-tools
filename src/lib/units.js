const UNITS = [
  {
    slug: 'microeconomics',
    name: 'Microeconomics',
    tier: 'large',
    tags: ['supply', 'demand', 'elasticity', 'market failure', 'government intervention', 'minimum wage', 'price ceiling', 'price floor'],
  },
  {
    slug: 'macroeconomics',
    name: 'Macroeconomics',
    tier: 'medium',
    tags: ['aggregate demand', 'aggregate supply', 'business cycle', 'fiscal policy', 'monetary policy'],
  },
  {
    slug: 'international',
    name: 'International Economics',
    tier: 'small',
    tags: ['trade', 'tariffs', 'exchange rate', 'quotas'],
  },
  {
    slug: 'development',
    name: 'Development Economics',
    tier: 'small',
    tags: ['growth', 'lorenz curve', 'inequality'],
  },
];

export function getUnits() {
  return UNITS;
}

export function unitHref(unit) {
  return `/units/wip.html?unit=${unit.slug}`;
}

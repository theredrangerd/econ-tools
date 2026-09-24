const UNITS = [
  {
    slug: 'microeconomics',
    name: 'Microeconomics',
    tier: 'large',
    status: 'coming-soon',
    tags: ['supply', 'demand', 'elasticity', 'market failure', 'government intervention', 'minimum wage', 'price ceiling', 'price floor'],
  },
  {
    slug: 'macroeconomics',
    name: 'Macroeconomics',
    tier: 'medium',
    status: 'coming-soon',
    tags: ['aggregate demand', 'aggregate supply', 'business cycle', 'fiscal policy', 'monetary policy'],
  },
  {
    slug: 'international',
    name: 'International Economics',
    tier: 'small',
    status: 'coming-soon',
    tags: ['trade', 'tariffs', 'exchange rate', 'quotas'],
  },
  {
    slug: 'development',
    name: 'Development Economics',
    tier: 'small',
    status: 'coming-soon',
    tags: ['growth', 'lorenz curve', 'inequality'],
  },
];

export function getUnits() {
  return UNITS;
}

export function unitHref(unit, base = import.meta.env.BASE_URL) {
  return `${base}units/wip.html?unit=${unit.slug}`;
}

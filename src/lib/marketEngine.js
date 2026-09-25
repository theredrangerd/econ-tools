export const QMAX = 100;
export const PMAX = 180;

function clampN(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function shoelaceArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % points.length];
    sum += ax * by - bx * ay;
  }
  return Math.abs(sum) / 2;
}

function csPolyFor(Dmax, Pd, Q, price) {
  return [[0, Dmax], [Q, Pd(Q)], [Q, price], [0, price]];
}

function psPolyFor(Smin, Ps, Q, price) {
  return [[0, Smin], [Q, Ps(Q)], [Q, price], [0, price]];
}

function dwlPolyFor(Q, Pd, Ps, Qstar, Pstar) {
  if (Math.abs(Q - Qstar) < 1e-9) return null;
  return [[Q, Pd(Q)], [Q, Ps(Q)], [Qstar, Pstar]];
}

function freeMarketResult(base) {
  const { Qstar, Pstar, Dmax, Smin, Pd, Ps } = base;
  const csPoly = csPolyFor(Dmax, Pd, Qstar, Pstar);
  const psPoly = psPolyFor(Smin, Ps, Qstar, Pstar);
  return {
    ...base,
    mode: 'free',
    Q: Qstar, Pc: Pstar, Pp: Pstar, gap: 0,
    CS: shoelaceArea(csPoly), PS: shoelaceArea(psPoly), DWL: 0,
    govRevenue: 0, govCost: 0,
    csPoly, psPoly, dwlPoly: null, wedgePoly: null,
    requestedControl: null,
  };
}

function rationingResult(base, intervention) {
  const { Dmax, Smin, Qstar, Pstar, Pd, Ps } = base;
  const isFloor = intervention.type === 'floor';
  const controlPrice = intervention.price;
  const binding = isFloor ? controlPrice > Pstar : controlPrice < Pstar;
  if (!binding) {
    return { ...freeMarketResult(base), requestedControl: { type: intervention.type, price: controlPrice } };
  }

  const qdRaw = Dmax - controlPrice;
  const qsRaw = controlPrice - Smin;
  const qd = clampN(qdRaw, 0, QMAX);
  const qs = clampN(qsRaw, 0, QMAX);
  const Q = Math.min(qd, qs);
  const gap = isFloor ? qsRaw - qdRaw : qdRaw - qsRaw;

  const csPoly = csPolyFor(Dmax, Pd, Q, controlPrice);
  const psPoly = psPolyFor(Smin, Ps, Q, controlPrice);
  const dwlPoly = dwlPolyFor(Q, Pd, Ps, Qstar, Pstar);

  return {
    ...base,
    mode: isFloor ? 'floor' : 'ceiling',
    Q, Pc: controlPrice, Pp: controlPrice, gap,
    CS: shoelaceArea(csPoly), PS: shoelaceArea(psPoly),
    DWL: dwlPoly ? shoelaceArea(dwlPoly) : 0,
    govRevenue: 0, govCost: 0,
    csPoly, psPoly, dwlPoly, wedgePoly: null,
    requestedControl: { type: intervention.type, price: controlPrice },
  };
}

function taxResult(base, intervention) {
  const { Dmax, Smin, slopeD, slopeS, Qstar, Pstar, Pd, Ps } = base;
  let Q, Pc, Pp;

  if (intervention.mode === 'advalorem') {
    const rate = intervention.rate;
    Q = clampN((Dmax - Smin * (1 + rate)) / (slopeD + slopeS * (1 + rate)), 0, QMAX);
    Pp = Ps(Q);
    Pc = Pp * (1 + rate);
  } else {
    const amount = intervention.amount;
    Q = clampN((Dmax - Smin - amount) / (slopeD + slopeS), 0, QMAX);
    Pc = Pd(Q);
    Pp = Pc - amount;
  }
  const wedge = Pc - Pp;

  const csPoly = csPolyFor(Dmax, Pd, Q, Pc);
  const psPoly = psPolyFor(Smin, Ps, Q, Pp);
  const dwlPoly = dwlPolyFor(Q, Pd, Ps, Qstar, Pstar);
  const wedgePoly = [[0, Pp], [Q, Pp], [Q, Pc], [0, Pc]];

  return {
    ...base,
    mode: 'tax',
    Q, Pc, Pp, gap: 0,
    CS: shoelaceArea(csPoly), PS: shoelaceArea(psPoly),
    DWL: dwlPoly ? shoelaceArea(dwlPoly) : 0,
    govRevenue: wedge * Q, govCost: 0,
    csPoly, psPoly, dwlPoly, wedgePoly,
    requestedControl: null,
  };
}

function subsidyResult(base, intervention) {
  const { Dmax, Smin, slopeD, slopeS, Qstar, Pstar, Pd, Ps } = base;
  const amount = intervention.amount;
  const Q = clampN((Dmax - Smin + amount) / (slopeD + slopeS), 0, QMAX);
  const Pc = Pd(Q);
  const Pp = Pc + amount;

  const csPoly = csPolyFor(Dmax, Pd, Q, Pc);
  const psPoly = psPolyFor(Smin, Ps, Q, Pp);
  const dwlPoly = dwlPolyFor(Q, Pd, Ps, Qstar, Pstar);
  const wedgePoly = [[0, Pc], [Q, Pc], [Q, Pp], [0, Pp]];

  return {
    ...base,
    mode: 'subsidy',
    Q, Pc, Pp, gap: 0,
    CS: shoelaceArea(csPoly), PS: shoelaceArea(psPoly),
    DWL: dwlPoly ? shoelaceArea(dwlPoly) : 0,
    govRevenue: 0, govCost: amount * Q,
    csPoly, psPoly, dwlPoly, wedgePoly,
    requestedControl: null,
  };
}

export function computeMarket({ demand, supply, slopeD, slopeS, intervention = { type: 'none' } }) {
  const Dmax = demand, Smin = supply;
  const noTrade = Dmax <= Smin;
  const Qstar = noTrade ? 0 : clampN((Dmax - Smin) / (slopeD + slopeS), 0, QMAX);
  const Pstar = Dmax - slopeD * Qstar;

  function Pd(q) { return Dmax - slopeD * q; }
  function Ps(q) { return Smin + slopeS * q; }

  const base = { Dmax, Smin, slopeD, slopeS, Qstar, Pstar, noTrade, Pd, Ps };

  if (noTrade) {
    return {
      ...base, mode: 'free', Q: 0, Pc: 0, Pp: 0, gap: 0,
      CS: 0, PS: 0, DWL: 0, govRevenue: 0, govCost: 0,
      csPoly: [], psPoly: [], dwlPoly: null, wedgePoly: null,
      requestedControl: null,
    };
  }

  switch (intervention.type) {
    case 'ceiling':
    case 'floor':
      return rationingResult(base, intervention);
    case 'tax':
      return taxResult(base, intervention);
    case 'subsidy':
      return subsidyResult(base, intervention);
    default:
      return freeMarketResult(base);
  }
}

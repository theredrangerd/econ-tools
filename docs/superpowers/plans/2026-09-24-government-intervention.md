# Government Intervention Family Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Microeconomics → Government Intervention family end-to-end: a shared, generalized supply/demand engine; four focused interactive diagram pages (Price Ceiling, Price Floor, Indirect Tax, Subsidy); and the navigation (unit page → family page → diagram pages) that makes them reachable and deep-linkable.

**Architecture:** Extract the economics (`computeMarket`) and SVG rendering (`renderMarketChart`) out of the existing `equilibrium-lab.html` prototype into two pure, reusable modules under `src/lib/`, generalized to cover ceiling/floor/tax(specific+ad-valorem)/subsidy as one intervention model instead of the prototype's ceiling+floor-only toggle logic. Each diagram then becomes its own standalone `.html` + `.js` page (matching the existing `index.html`/`home.js` and `units/wip.html`/`wip.js` pattern already in the repo) that imports the shared engine/renderer and wires up only the controls relevant to that one scenario. Navigation is wired top-down: the Microeconomics unit page and the Government Intervention family page are built last, once the diagram pages they link to already exist.

**Tech Stack:** Vite + vanilla JS (ESM), Vitest + jsdom for tests, hand-authored SVG (no charting library), existing shared `tokens.css`/`pages.css`.

**Spec:** `docs/superpowers/specs/2026-09-24-ib-econ-graph-site-design.md` (see "Microeconomics roadmap" section — this plan implements the Government Intervention slice of that roadmap).

## Global Constraints

- No UI framework — plain ESM modules, following the existing `src/components/*.js` / `src/pages/*.js` / `*-entry.js` split.
- Every page is a real `.html` file under multi-page mode; no client-side router. New pages must be added to `vite.config.js`'s `build.rollupOptions.input` or they will not appear in `dist/` on build.
- Reuse `src/styles/tokens.css` custom properties for all color — never hardcode hex values in new code.
- Every new page embeds the feedback iframe pattern is NOT required on diagram pages themselves (only unit/family "coming soon" stubs carry the feedback form per the spec) — diagram pages only need the shared mini-header via `renderMiniHeader`.
- SL/HL tag: every diagram tile and the diagram page itself must show its level. All four diagrams in this plan are **SL** (core syllabus, not Theory of the Firm).
- Unbuilt family/diagram tiles must link to `units/wip.html?unit=<slug>` (reusing the existing WIP stub), never to a dead link or omitted tile.
- `equilibrium-lab.html` is retired (deleted) once its content is ported — no redirect.
- Follow existing test conventions exactly: Vitest `describe`/`it` with a rationale clause in the `it()` string (see `src/lib/units.test.js`, `src/components/bento.test.js`), jsdom for DOM tests, an `*.integration.test.js` that loads the real `.html` file's `<body>` via `readFileSync` for every page that has one (see `src/pages/wip.integration.test.js`).

## Review Focus

- **Non-binding intervention prices** (e.g. a ceiling set above equilibrium, or a floor below it): the engine must fall back to the free-market result (mode `'free'`, zero DWL), not silently draw a broken/negative-area region. Task 2 tests this explicitly for ceiling and floor.
- **Demand ≤ supply (`noTrade`) combined with an active intervention**: sliders can be dragged into a state where `Dmax <= Smin` while a tax/subsidy/ceiling/floor toggle is on. The engine must short-circuit to the `noTrade` base result before running any intervention-specific formula (which would otherwise divide by a valid-looking but economically meaningless denominator). Task 2 tests this for every intervention type.
- **Ad-valorem tax at a 0% rate**: must degenerate to the free-market result exactly (Q=Qstar, wedge=0, govRevenue=0), not throw or divide by zero — this is the toggle's natural "off-ish" edge when a student drags the rate slider down.
- **Rounding/formatting of money vs. quantity in the stats panel**: `fmtMoney` rounds to whole dollars while `fmtQty` keeps one decimal (both already established in the prototype) — a page module that mixes these up on the tax/subsidy pages (new stats: tax revenue, government cost) will show inconsistent precision. Tasks 9–12 test each page's stat formatting against known clean inputs.
- **Missing/renamed DOM ids between a page's `.html` markup and its `.js` wiring module**: every page task includes an integration test that loads the real `.html` file (not an inline test fixture) so a typo in an id attribute fails the test suite instead of failing silently in the browser.

---

## File Structure

```
src/lib/
  marketEngine.js         # NEW — pure economics: computeMarket(), QMAX, PMAX
  marketEngine.test.js    # NEW
  format.js               # NEW — fmtMoney, fmtPrice, fmtQty
  format.test.js          # NEW
  marketChart.js          # NEW — renderMarketChart(svgEl, result) SVG renderer
  marketChart.test.js     # NEW
  units.js                # MODIFY — nest families/diagrams under microeconomics
  units.test.js           # MODIFY

src/components/
  bento.js                # MODIFY — accept precomputed href + SL/HL badge
  bento.test.js           # MODIFY

src/styles/
  tokens.css              # MODIFY — add --unit-microeconomics accent token
  pages.css               # MODIFY — port graph-page layout classes from equilibrium-lab.html

src/pages/
  microeconomics.js + microeconomics-entry.js + microeconomics.test.js + microeconomics.integration.test.js       # NEW
  government-intervention.js + -entry.js + .test.js + .integration.test.js                                        # NEW
  price-ceiling.js + -entry.js + .test.js + .integration.test.js                                                   # NEW
  price-floor.js + -entry.js + .test.js + .integration.test.js                                                     # NEW
  indirect-tax.js + -entry.js + .test.js + .integration.test.js                                                    # NEW
  subsidy.js + -entry.js + .test.js + .integration.test.js                                                         # NEW
  home.js                 # MODIFY — Microeconomics tile now links to its real unit page

units/microeconomics.html                                    # NEW
units/microeconomics/government-intervention.html            # NEW
units/microeconomics/government-intervention/price-ceiling.html   # NEW
units/microeconomics/government-intervention/price-floor.html     # NEW
units/microeconomics/government-intervention/indirect-tax.html    # NEW
units/microeconomics/government-intervention/subsidy.html         # NEW

vite.config.js           # MODIFY — register all six new page entries
equilibrium-lab.html     # DELETE (Task 13)
```

---

### Task 1: Port graph-page layout CSS into the shared stylesheet

**Files:**
- Modify: `src/styles/pages.css`
- Test: `src/styles/pages.test.js` (new)

**Interfaces:**
- Produces: CSS classes `.layout`, `.card`, `.chart-card`, `.chart-head`, `.chart-title`, `.status-pill` (+ `.status-pill.floor` / `.ceiling` / `.tax` / `.subsidy` / `.free` variants), `.legend`, `.sidebar`, `.panel`, `.slider-row`, `.slider-label`, `.slider-hint`, `input[type="range"]`, `.toggle-row`, `.switch`, `.sub-slider`, `.stats-grid`, `.stat` (+ `.dwl`/`.cs`/`.ps`/`.gov` variants, `.wide`), `.note`, `.reset-btn`, `.level-pill` (new — SL/HL badge), plus SVG text classes `.axis-label`, `.tick-label`, `.curve-label`. Every later page task consumes these classes verbatim.

- [ ] **Step 1: Write the failing test**

```js
// src/styles/pages.test.js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function readPagesCss() {
  const dir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(dir, 'pages.css'), 'utf8');
}

describe('shared pages stylesheet', () => {
  it('defines the graph-page layout classes ported from the Equilibrium Lab prototype', () => {
    const css = readPagesCss();
    [
      '.layout', '.card', '.chart-card', '.chart-title', '.status-pill',
      '.legend', '.sidebar', '.panel', '.slider-row', '.toggle-row',
      '.switch', '.sub-slider', '.stats-grid', '.stat', '.note', '.reset-btn',
    ].forEach((selector) => {
      expect(css).toContain(selector);
    });
  });

  it('defines a level-pill class for the SL/HL badge', () => {
    expect(readPagesCss()).toContain('.level-pill');
  });

  it('defines a gov stat variant for tax revenue / subsidy cost figures', () => {
    expect(readPagesCss()).toContain('.stat.gov');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/styles/pages.test.js`
Expected: FAIL — none of these selectors exist in `pages.css` yet.

- [ ] **Step 3: Append the ported layout CSS to `pages.css`**

Append this block to the end of `src/styles/pages.css` (keep everything already in the file — this only adds new rules):

```css
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.95fr);
  gap: 20px;
  align-items: start;
}

@media (max-width: 880px) {
  .layout { grid-template-columns: 1fr; }
}

.card {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  box-shadow: var(--shadow);
}

.chart-card { padding: 20px 20px 12px; }

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 4px;
}

.chart-title {
  font-family: "Source Serif 4", serif;
  font-weight: 600;
  font-size: 18px;
  margin: 0;
}

.level-pill {
  font-family: "IBM Plex Mono", monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid var(--hairline-2);
  color: var(--ink-secondary);
  background: var(--surface-2);
}

.status-pill {
  font-family: "IBM Plex Mono", monospace;
  font-size: 11.5px;
  letter-spacing: 0.02em;
  padding: 5px 10px;
  border-radius: 999px;
  white-space: nowrap;
  background: var(--surface-2);
  color: var(--ink-secondary);
  border: 1px solid var(--hairline);
}
.status-pill.floor,
.status-pill.tax { color: var(--supply); border-color: color-mix(in srgb, var(--supply) 40%, var(--hairline)); background: var(--supply-fill); }
.status-pill.ceiling,
.status-pill.subsidy { color: var(--dwl-line); border-color: color-mix(in srgb, var(--dwl-line) 40%, var(--hairline)); background: var(--dwl-fill); }
.status-pill.free { color: var(--good); }

svg.market-chart { width: 100%; height: auto; display: block; }

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 20px;
  padding: 10px 4px 14px;
  font-size: 12.5px;
  color: var(--ink-secondary);
}
.legend .item { display: flex; align-items: center; gap: 7px; }
.legend .swatch { width: 13px; height: 13px; border-radius: 3px; flex: none; }
.legend .line { width: 16px; height: 2px; border-radius: 1px; flex: none; }

.sidebar { display: flex; flex-direction: column; gap: 16px; }

.panel { padding: 18px 20px 20px; }
.panel h2 {
  font-family: "IBM Plex Mono", monospace;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  font-weight: 500;
  margin: 0 0 14px;
}

.slider-row { margin-bottom: 18px; }
.slider-row:last-child { margin-bottom: 0; }

.slider-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13.5px;
  font-weight: 500;
  margin-bottom: 2px;
}
.slider-label .val {
  font-family: "IBM Plex Mono", monospace;
  font-variant-numeric: tabular-nums;
  color: var(--ink-secondary);
  font-weight: 400;
  font-size: 13px;
}
.slider-hint { font-size: 11.5px; color: var(--ink-muted); margin: 0 0 8px; }

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: var(--hairline-2);
  outline: none;
  cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: currentColor;
  border: 2px solid var(--surface);
  box-shadow: 0 0 0 1px var(--hairline-2);
  cursor: pointer;
}
input[type="range"]::-moz-range-thumb {
  width: 16px; height: 16px;
  border-radius: 50%;
  background: currentColor;
  border: 2px solid var(--surface);
  box-shadow: 0 0 0 1px var(--hairline-2);
  cursor: pointer;
}

.toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.toggle-row + .toggle-row { margin-top: 16px; }
.toggle-row .label { font-size: 13.5px; font-weight: 500; }
.toggle-row .sub { display: block; font-size: 11.5px; font-weight: 400; color: var(--ink-muted); margin-top: 1px; }

.switch { position: relative; width: 38px; height: 22px; flex: none; }
.switch input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; z-index: 1; }
.switch .track { position: absolute; inset: 0; background: var(--hairline-2); border-radius: 999px; transition: background 0.15s ease; }
.switch .thumb {
  position: absolute; top: 2px; left: 2px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: transform 0.15s ease;
}
.switch input:checked ~ .track { background: var(--accent); }
.switch input:checked ~ .thumb { transform: translateX(16px); }
.switch input:focus-visible ~ .track { outline: 2px solid var(--accent); outline-offset: 2px; }

.sub-slider {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 0.2s ease, opacity 0.2s ease;
}
.sub-slider > * { min-height: 0; overflow: hidden; }
.sub-slider.open { grid-template-rows: 1fr; opacity: 1; margin-top: 12px; }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat { background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 10px; padding: 10px 12px; }
.stat .k { font-size: 11px; color: var(--ink-muted); letter-spacing: 0.02em; }
.stat .v { font-family: "IBM Plex Mono", monospace; font-variant-numeric: tabular-nums; font-size: 18px; font-weight: 500; margin-top: 2px; }
.stat.dwl .v { color: var(--dwl-line); }
.stat.cs .v { color: var(--demand); }
.stat.ps .v { color: var(--supply); }
.stat.gov .v { color: var(--accent); }
.stat.wide { grid-column: 1 / -1; }

.note {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-secondary);
  background: var(--surface-2);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 12px;
}
.note strong { color: var(--ink); }

.reset-btn {
  font-family: "IBM Plex Sans", sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-secondary);
  background: var(--surface-2);
  border: 1px solid var(--hairline-2);
  border-radius: 8px;
  padding: 7px 12px;
  cursor: pointer;
}
.reset-btn:hover { color: var(--ink); border-color: var(--ink-muted); }
.reset-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.market-chart text { font-family: "IBM Plex Sans", sans-serif; }
.market-chart .axis-label { fill: var(--ink-muted); font-size: 12px; }
.market-chart .tick-label { fill: var(--ink-muted); font-size: 10.5px; font-family: "IBM Plex Mono", monospace; }
.market-chart .curve-label { font-size: 12.5px; font-weight: 600; font-family: "IBM Plex Sans", sans-serif; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/styles/pages.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/styles/pages.css src/styles/pages.test.js
git commit -m "feat: port graph-page layout CSS from Equilibrium Lab into shared stylesheet"
```

---

### Task 2: Pure market engine (`computeMarket`)

**Files:**
- Create: `src/lib/marketEngine.js`
- Test: `src/lib/marketEngine.test.js`

**Interfaces:**
- Produces: `computeMarket({ demand, supply, slopeD, slopeS, intervention })` → result object `{ Dmax, Smin, slopeD, slopeS, Qstar, Pstar, noTrade, Pd, Ps, mode, Q, Pc, Pp, gap, CS, PS, DWL, govRevenue, govCost, csPoly, psPoly, dwlPoly, wedgePoly }`. `intervention` is one of `{ type: 'none' }`, `{ type: 'ceiling', price }`, `{ type: 'floor', price }`, `{ type: 'tax', mode: 'specific', amount }`, `{ type: 'tax', mode: 'advalorem', rate }`, `{ type: 'subsidy', amount }`. Also exports `QMAX` (100) and `PMAX` (180).
- Consumes: nothing (pure math, no DOM).

- [ ] **Step 1: Write the failing tests**

```js
// src/lib/marketEngine.test.js
import { describe, it, expect } from 'vitest';
import { computeMarket } from './marketEngine.js';

const base = { demand: 140, supply: 20, slopeD: 1, slopeS: 1 };

describe('computeMarket — free market', () => {
  it('clears at the textbook equilibrium with no deadweight loss', () => {
    const r = computeMarket({ ...base, intervention: { type: 'none' } });
    expect(r.mode).toBe('free');
    expect(r.Q).toBe(60);
    expect(r.Pc).toBe(80);
    expect(r.Pp).toBe(80);
    expect(r.CS).toBe(1800);
    expect(r.PS).toBe(1800);
    expect(r.DWL).toBe(0);
  });

  it('short-circuits to noTrade with zero surplus when demand never exceeds supply', () => {
    const r = computeMarket({ demand: 10, supply: 50, slopeD: 1, slopeS: 1, intervention: { type: 'none' } });
    expect(r.noTrade).toBe(true);
    expect(r.CS).toBe(0);
    expect(r.PS).toBe(0);
    expect(r.DWL).toBe(0);
  });
});

describe('computeMarket — price ceiling', () => {
  it('rations quantity down to the shorter side of the market when binding', () => {
    const r = computeMarket({ ...base, intervention: { type: 'ceiling', price: 50 } });
    expect(r.mode).toBe('ceiling');
    expect(r.Q).toBe(30);
    expect(r.Pc).toBe(50);
    expect(r.Pp).toBe(50);
    expect(r.gap).toBe(60);
    expect(r.CS).toBe(2250);
    expect(r.PS).toBe(450);
    expect(r.DWL).toBe(900);
  });

  it('falls back to the free-market result when the ceiling is set above equilibrium', () => {
    const r = computeMarket({ ...base, intervention: { type: 'ceiling', price: 100 } });
    expect(r.mode).toBe('free');
    expect(r.Q).toBe(60);
    expect(r.DWL).toBe(0);
  });

  it('short-circuits to noTrade even with a ceiling active, instead of dividing by a meaningless denominator', () => {
    const r = computeMarket({ demand: 10, supply: 50, slopeD: 1, slopeS: 1, intervention: { type: 'ceiling', price: 5 } });
    expect(r.noTrade).toBe(true);
    expect(r.DWL).toBe(0);
  });
});

describe('computeMarket — price floor', () => {
  it('rations quantity down to the shorter side of the market when binding', () => {
    const r = computeMarket({ ...base, intervention: { type: 'floor', price: 110 } });
    expect(r.mode).toBe('floor');
    expect(r.Q).toBe(30);
    expect(r.Pc).toBe(110);
    expect(r.Pp).toBe(110);
    expect(r.gap).toBe(60);
    expect(r.CS).toBe(450);
    expect(r.PS).toBe(2250);
    expect(r.DWL).toBe(900);
  });

  it('falls back to the free-market result when the floor is set below equilibrium', () => {
    const r = computeMarket({ ...base, intervention: { type: 'floor', price: 50 } });
    expect(r.mode).toBe('free');
    expect(r.Q).toBe(60);
    expect(r.DWL).toBe(0);
  });
});

describe('computeMarket — specific (per-unit) tax', () => {
  it('opens a wedge between what consumers pay and producers receive', () => {
    const r = computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 20 } });
    expect(r.mode).toBe('tax');
    expect(r.Q).toBe(50);
    expect(r.Pc).toBe(90);
    expect(r.Pp).toBe(70);
    expect(r.govRevenue).toBe(1000);
  });

  it('short-circuits to noTrade instead of computing a nonsense quantity', () => {
    const r = computeMarket({ demand: 10, supply: 50, slopeD: 1, slopeS: 1, intervention: { type: 'tax', mode: 'specific', amount: 20 } });
    expect(r.noTrade).toBe(true);
    expect(r.govRevenue).toBe(0);
  });
});

describe('computeMarket — ad valorem tax', () => {
  it('opens a proportional wedge based on the rate', () => {
    const r = computeMarket({ ...base, intervention: { type: 'tax', mode: 'advalorem', rate: 0.5 } });
    expect(r.mode).toBe('tax');
    expect(r.Q).toBe(44);
    expect(r.Pp).toBe(64);
    expect(r.Pc).toBe(96);
    expect(r.govRevenue).toBe(1408);
  });

  it('degenerates to the free-market result at a 0% rate', () => {
    const r = computeMarket({ ...base, intervention: { type: 'tax', mode: 'advalorem', rate: 0 } });
    expect(r.Q).toBe(60);
    expect(r.Pc).toBe(80);
    expect(r.Pp).toBe(80);
    expect(r.govRevenue).toBe(0);
  });
});

describe('computeMarket — subsidy', () => {
  it('widens the wedge the other way, increasing quantity above equilibrium', () => {
    const r = computeMarket({ ...base, intervention: { type: 'subsidy', amount: 20 } });
    expect(r.mode).toBe('subsidy');
    expect(r.Q).toBe(70);
    expect(r.Pc).toBe(70);
    expect(r.Pp).toBe(90);
    expect(r.govCost).toBe(1400);
    expect(r.DWL).toBeGreaterThan(0);
  });

  it('short-circuits to noTrade instead of computing a nonsense quantity', () => {
    const r = computeMarket({ demand: 10, supply: 50, slopeD: 1, slopeS: 1, intervention: { type: 'subsidy', amount: 20 } });
    expect(r.noTrade).toBe(true);
    expect(r.govCost).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/marketEngine.test.js`
Expected: FAIL with "Cannot find module './marketEngine.js'"

- [ ] **Step 3: Implement `marketEngine.js`**

```js
// src/lib/marketEngine.js
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
  };
}

function rationingResult(base, intervention) {
  const { Dmax, Smin, Qstar, Pstar, Pd, Ps } = base;
  const isFloor = intervention.type === 'floor';
  const controlPrice = intervention.price;
  const binding = isFloor ? controlPrice > Pstar : controlPrice < Pstar;
  if (!binding) return freeMarketResult(base);

  const qd = clampN(Dmax - controlPrice, 0, QMAX);
  const qs = clampN(controlPrice - Smin, 0, QMAX);
  const Q = Math.min(qd, qs);
  const gap = isFloor ? qs - qd : qd - qs;

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/marketEngine.test.js`
Expected: PASS (all cases)

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketEngine.js src/lib/marketEngine.test.js
git commit -m "feat: add generalized market engine for ceiling/floor/tax/subsidy"
```

---

### Task 3: Formatting helpers

**Files:**
- Create: `src/lib/format.js`
- Test: `src/lib/format.test.js`

**Interfaces:**
- Produces: `fmtMoney(v)` → `"$1,800"` (whole dollars, thousands separator), `fmtPrice(v)` → `"$80.00"` (2dp), `fmtQty(v)` → `"60.0"` (1dp).

- [ ] **Step 1: Write the failing test**

```js
// src/lib/format.test.js
import { describe, it, expect } from 'vitest';
import { fmtMoney, fmtPrice, fmtQty } from './format.js';

describe('fmtMoney', () => {
  it('rounds to whole dollars with a thousands separator', () => {
    expect(fmtMoney(1800)).toBe('$1,800');
    expect(fmtMoney(0)).toBe('$0');
  });
});

describe('fmtPrice', () => {
  it('shows exactly two decimal places', () => {
    expect(fmtPrice(80)).toBe('$80.00');
    expect(fmtPrice(96)).toBe('$96.00');
  });
});

describe('fmtQty', () => {
  it('shows exactly one decimal place', () => {
    expect(fmtQty(60)).toBe('60.0');
    expect(fmtQty(44)).toBe('44.0');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/format.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

```js
// src/lib/format.js
export function fmtMoney(v) {
  return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
export function fmtPrice(v) { return '$' + v.toFixed(2); }
export function fmtQty(v) { return v.toFixed(1); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/format.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.js src/lib/format.test.js
git commit -m "feat: add shared money/price/quantity formatters"
```

---

### Task 4: Shared SVG chart renderer (`renderMarketChart`)

**Files:**
- Create: `src/lib/marketChart.js`
- Test: `src/lib/marketChart.test.js`

**Interfaces:**
- Consumes: a `result` object shaped exactly like `computeMarket`'s return value (Task 2), and `QMAX`/`PMAX` from `marketEngine.js`.
- Produces: `renderMarketChart(svgEl, result)` — clears and redraws `svgEl` (an `<svg class="market-chart">` element) with gridlines, axes, demand/supply curves, CS/PS/DWL fills, and (when `result.mode` is `'ceiling'`/`'floor'`/`'tax'`/`'subsidy'`) the relevant reference line(s) and, for tax/subsidy, the `wedgePoly` revenue/cost rectangle. Returns nothing; callers read `result` directly for their own stats-panel text.

- [ ] **Step 1: Write the failing test**

```js
// src/lib/marketChart.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { computeMarket } from './marketEngine.js';
import { renderMarketChart } from './marketChart.js';

function makeSvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'market-chart');
  return svg;
}

const base = { demand: 140, supply: 20, slopeD: 1, slopeS: 1 };

describe('renderMarketChart', () => {
  let svg;
  beforeEach(() => { svg = makeSvg(); });

  it('draws the demand and supply curve lines for a free market', () => {
    const result = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.demand-curve')).toHaveLength(1);
    expect(svg.querySelectorAll('line.supply-curve')).toHaveLength(1);
  });

  it('draws a CS and PS fill polygon when trade occurs', () => {
    const result = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, result);
    expect(svg.querySelector('polygon.cs-fill')).not.toBeNull();
    expect(svg.querySelector('polygon.ps-fill')).not.toBeNull();
  });

  it('draws a DWL fill and outline when a ceiling binds', () => {
    const result = computeMarket({ ...base, intervention: { type: 'ceiling', price: 50 } });
    renderMarketChart(svg, result);
    expect(svg.querySelector('polygon.dwl-fill')).not.toBeNull();
    expect(svg.querySelector('polygon.dwl-outline')).not.toBeNull();
  });

  it('omits the DWL fill in a free market', () => {
    const result = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, result);
    expect(svg.querySelector('polygon.dwl-fill')).toBeNull();
  });

  it('draws two wedge reference lines and a revenue rectangle for a tax', () => {
    const result = computeMarket({ ...base, intervention: { type: 'tax', mode: 'specific', amount: 20 } });
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.wedge-line')).toHaveLength(2);
    expect(svg.querySelector('polygon.wedge-fill')).not.toBeNull();
  });

  it('draws a single reference line for a binding price floor', () => {
    const result = computeMarket({ ...base, intervention: { type: 'floor', price: 110 } });
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.wedge-line')).toHaveLength(1);
    expect(svg.querySelector('polygon.wedge-fill')).toBeNull();
  });

  it('clears previously drawn content on re-render, so dragging a slider does not accumulate elements', () => {
    const result = computeMarket({ ...base, intervention: { type: 'none' } });
    renderMarketChart(svg, result);
    renderMarketChart(svg, result);
    expect(svg.querySelectorAll('line.demand-curve')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/marketChart.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `marketChart.js`**

```js
// src/lib/marketChart.js
import { QMAX, PMAX } from './marketEngine.js';

const M = { left: 64, right: 24, top: 24, bottom: 56 };
const VBW = 780, VBH = 520;
const plotW = VBW - M.left - M.right;
const plotH = VBH - M.top - M.bottom;

function clampN(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function sx(q) { return M.left + (q / QMAX) * plotW; }
function sy(p) { return M.top + plotH - (clampN(p, -20, PMAX + 40) / PMAX) * plotH; }

const svgns = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, className) {
  const e = document.createElementNS(svgns, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (className) e.setAttribute('class', className);
  return e;
}
function pts(arr) { return arr.map(([q, p]) => `${sx(q)},${sy(p)}`).join(' '); }

function clipDemand(Dmax, slopeD) {
  const qAtPmax = (Dmax - PMAX) / slopeD, qAtP0 = Dmax / slopeD;
  const q0 = clampN(qAtPmax, 0, QMAX), q1 = clampN(qAtP0, 0, QMAX);
  return [[q0, Dmax - slopeD * q0], [q1, Dmax - slopeD * q1]];
}
function clipSupply(Smin, slopeS) {
  const qAtP0 = -Smin / slopeS, qAtPmax = (PMAX - Smin) / slopeS;
  const q0 = clampN(qAtP0, 0, QMAX), q1 = clampN(qAtPmax, 0, QMAX);
  return [[q0, Smin + slopeS * q0], [q1, Smin + slopeS * q1]];
}

function drawGridAndAxes(svg) {
  const defs = el('defs');
  const pattern = el('pattern', { id: 'dwlHatch', width: 6, height: 6, patternTransform: 'rotate(45)', patternUnits: 'userSpaceOnUse' });
  pattern.appendChild(el('rect', { width: 6, height: 6, fill: 'var(--dwl-fill)' }));
  pattern.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: 'var(--dwl-hatch)', 'stroke-width': 1.4 }));
  defs.appendChild(pattern);
  svg.appendChild(defs);

  svg.appendChild(el('rect', { x: M.left, y: M.top, width: plotW, height: plotH, fill: 'var(--surface)', stroke: 'none' }));

  const g = el('g');
  for (let qq = 0; qq <= QMAX; qq += 20) {
    g.appendChild(el('line', { x1: sx(qq), y1: M.top, x2: sx(qq), y2: M.top + plotH, stroke: 'var(--hairline)', 'stroke-width': 1 }));
    const lbl = el('text', { x: sx(qq), y: M.top + plotH + 20, 'text-anchor': 'middle' }, 'tick-label');
    lbl.textContent = qq;
    g.appendChild(lbl);
  }
  for (let pp = 0; pp <= PMAX; pp += 20) {
    g.appendChild(el('line', { x1: M.left, y1: sy(pp), x2: M.left + plotW, y2: sy(pp), stroke: 'var(--hairline)', 'stroke-width': 1 }));
    const plbl = el('text', { x: M.left - 10, y: sy(pp) + 4, 'text-anchor': 'end' }, 'tick-label');
    plbl.textContent = pp;
    g.appendChild(plbl);
  }
  svg.appendChild(g);

  svg.appendChild(el('line', { x1: M.left, y1: M.top, x2: M.left, y2: M.top + plotH, stroke: 'var(--hairline-2)', 'stroke-width': 1.5 }));
  svg.appendChild(el('line', { x1: M.left, y1: M.top + plotH, x2: M.left + plotW, y2: M.top + plotH, stroke: 'var(--hairline-2)', 'stroke-width': 1.5 }));

  const xl = el('text', { x: M.left + plotW / 2, y: VBH - 10, 'text-anchor': 'middle' }, 'axis-label');
  xl.textContent = 'Quantity (units)';
  svg.appendChild(xl);
  const yl = el('text', { x: 16, y: M.top + plotH / 2, 'text-anchor': 'middle', transform: `rotate(-90 16 ${M.top + plotH / 2})` }, 'axis-label');
  yl.textContent = 'Price ($ / unit)';
  svg.appendChild(yl);
}

const MODE_LABELS = {
  ceiling: 'Price ceiling',
  floor: 'Price floor',
};

function drawWedgeLines(svg, result) {
  if (result.mode === 'ceiling' || result.mode === 'floor') {
    const y = sy(result.Pc);
    svg.appendChild(el('line', { x1: M.left, y1: y, x2: M.left + plotW, y2: y, stroke: 'var(--dwl-line)', 'stroke-width': 1.6, 'stroke-dasharray': '6,3' }, 'wedge-line'));
    const lbl = el('text', { x: M.left + plotW - 6, y: y - 6, 'text-anchor': 'end', fill: 'var(--dwl-line)' }, 'tick-label');
    lbl.textContent = MODE_LABELS[result.mode];
    svg.appendChild(lbl);
  } else if (result.mode === 'tax' || result.mode === 'subsidy') {
    svg.appendChild(el('polygon', { points: pts(result.wedgePoly), fill: 'var(--supply-fill)' }, 'wedge-fill'));
    const yc = sy(result.Pc), yp = sy(result.Pp);
    svg.appendChild(el('line', { x1: M.left, y1: yc, x2: M.left + plotW, y2: yc, stroke: 'var(--demand)', 'stroke-width': 1.6, 'stroke-dasharray': '6,3' }, 'wedge-line'));
    svg.appendChild(el('line', { x1: M.left, y1: yp, x2: M.left + plotW, y2: yp, stroke: 'var(--supply)', 'stroke-width': 1.6, 'stroke-dasharray': '6,3' }, 'wedge-line'));
    const cLbl = el('text', { x: M.left + plotW - 6, y: yc - 6, 'text-anchor': 'end', fill: 'var(--demand)' }, 'tick-label');
    cLbl.textContent = 'Price consumers pay';
    svg.appendChild(cLbl);
    const pLbl = el('text', { x: M.left + plotW - 6, y: yp + 14, 'text-anchor': 'end', fill: 'var(--supply)' }, 'tick-label');
    pLbl.textContent = 'Price producers receive';
    svg.appendChild(pLbl);
  }
}

export function renderMarketChart(svg, result) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.setAttribute('viewBox', `0 0 ${VBW} ${VBH}`);

  drawGridAndAxes(svg);

  if (!result.noTrade) {
    svg.appendChild(el('polygon', { points: pts(result.csPoly), fill: 'var(--demand-fill)' }, 'cs-fill'));
    svg.appendChild(el('polygon', { points: pts(result.psPoly), fill: 'var(--supply-fill)' }, 'ps-fill'));
    if (result.dwlPoly) {
      svg.appendChild(el('polygon', { points: pts(result.dwlPoly), fill: 'url(#dwlHatch)' }, 'dwl-fill'));
      svg.appendChild(el('polygon', { points: pts(result.dwlPoly), fill: 'none', stroke: 'var(--dwl-line)', 'stroke-width': 1.3, 'stroke-dasharray': '3,2' }, 'dwl-outline'));
    }
  }

  const dSeg = clipDemand(result.Dmax, result.slopeD), sSeg = clipSupply(result.Smin, result.slopeS);
  svg.appendChild(el('line', { x1: sx(dSeg[0][0]), y1: sy(dSeg[0][1]), x2: sx(dSeg[1][0]), y2: sy(dSeg[1][1]), stroke: 'var(--demand)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, 'demand-curve'));
  svg.appendChild(el('line', { x1: sx(sSeg[0][0]), y1: sy(sSeg[0][1]), x2: sx(sSeg[1][0]), y2: sy(sSeg[1][1]), stroke: 'var(--supply)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, 'supply-curve'));

  const dLbl = el('text', { x: sx(dSeg[0][0]) + 8, y: sy(dSeg[0][1]) - 6, fill: 'var(--demand)' }, 'curve-label');
  dLbl.textContent = 'Demand';
  svg.appendChild(dLbl);
  const sLbl = el('text', { x: sx(sSeg[1][0]) - 8, y: sy(sSeg[1][1]) - 8, fill: 'var(--supply)', 'text-anchor': 'end' }, 'curve-label');
  sLbl.textContent = 'Supply';
  svg.appendChild(sLbl);

  if (!result.noTrade) {
    svg.appendChild(el('line', { x1: sx(result.Qstar), y1: sy(result.Pstar), x2: sx(result.Qstar), y2: M.top + plotH, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '3,3' }));
    svg.appendChild(el('line', { x1: M.left, y1: sy(result.Pstar), x2: sx(result.Qstar), y2: sy(result.Pstar), stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '3,3' }));
    svg.appendChild(el('circle', { cx: sx(result.Qstar), cy: sy(result.Pstar), r: 4.5, fill: 'var(--ink)' }));

    drawWedgeLines(svg, result);

    if (result.mode !== 'free') {
      svg.appendChild(el('line', { x1: sx(result.Q), y1: sy(result.Pc), x2: sx(result.Q), y2: M.top + plotH, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '1,3' }));
      svg.appendChild(el('circle', { cx: sx(result.Q), cy: sy(result.Pc), r: 4, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 1.8 }));
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/marketChart.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketChart.js src/lib/marketChart.test.js
git commit -m "feat: add shared SVG market chart renderer"
```

---

### Task 5: Restructure `units.js` data model (families + diagrams)

**Files:**
- Modify: `src/lib/units.js`
- Modify: `src/lib/units.test.js`

**Interfaces:**
- Produces: `getUnits()` unchanged in shape for existing callers (still 4 units with `slug`/`name`/`tier`/`status`/`tags`), but the Microeconomics entry gains a `families` array: `{ slug, name, status, diagrams: [{ slug, name, level, status, tags }] }`. New helpers: `unitHref(unit, base)` — now returns the unit's real page when `status: 'built'`, else the WIP stub (existing behavior preserved for `coming-soon`); `familyHref(unit, family, base)`; `diagramHref(unit, family, diagram, base)`.
- Consumes: nothing.

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/units.test.js` (keep all existing tests, add these):

```js
import { getUnits, unitHref, familyHref, diagramHref } from './units.js';

describe('microeconomics families', () => {
  it('lists the five topic families in syllabus/teaching order', () => {
    const micro = getUnits().find((u) => u.slug === 'microeconomics');
    const slugs = micro.families.map((f) => f.slug);
    expect(slugs).toEqual([
      'demand-and-supply',
      'elasticity',
      'government-intervention',
      'market-failure',
      'theory-of-the-firm',
    ]);
  });

  it('marks government-intervention as built and every other family as coming-soon', () => {
    const micro = getUnits().find((u) => u.slug === 'microeconomics');
    const byStatus = Object.fromEntries(micro.families.map((f) => [f.slug, f.status]));
    expect(byStatus['government-intervention']).toBe('built');
    expect(byStatus['demand-and-supply']).toBe('coming-soon');
    expect(byStatus['theory-of-the-firm']).toBe('coming-soon');
  });

  it('lists price ceiling, price floor, indirect tax, and subsidy as built SL diagrams in government-intervention', () => {
    const micro = getUnits().find((u) => u.slug === 'microeconomics');
    const gi = micro.families.find((f) => f.slug === 'government-intervention');
    const built = gi.diagrams.filter((d) => d.status === 'built').map((d) => d.slug);
    expect(built).toEqual(['price-ceiling', 'price-floor', 'indirect-tax', 'subsidy']);
    gi.diagrams.filter((d) => d.status === 'built').forEach((d) => {
      expect(d.level).toBe('SL');
    });
  });

  it('flags theory-of-the-firm diagrams as HL', () => {
    const micro = getUnits().find((u) => u.slug === 'microeconomics');
    const totf = micro.families.find((f) => f.slug === 'theory-of-the-firm');
    totf.diagrams.forEach((d) => {
      expect(d.level).toBe('HL');
    });
  });
});

describe('unitHref for a built unit', () => {
  it('links straight to the real unit page instead of the WIP stub', () => {
    expect(unitHref({ slug: 'microeconomics', status: 'built' })).toBe('/units/microeconomics.html');
  });

  it('still links to the WIP stub for a coming-soon unit', () => {
    expect(unitHref({ slug: 'macroeconomics', status: 'coming-soon' })).toBe('/units/wip.html?unit=macroeconomics');
  });
});

describe('familyHref', () => {
  it('links to the real family page when built', () => {
    expect(familyHref({ slug: 'microeconomics' }, { slug: 'government-intervention', status: 'built' })).toBe(
      '/units/microeconomics/government-intervention.html'
    );
  });

  it('links to the WIP stub, tagged with the family slug, when not built', () => {
    expect(familyHref({ slug: 'microeconomics' }, { slug: 'market-failure', status: 'coming-soon' })).toBe(
      '/units/wip.html?unit=market-failure'
    );
  });
});

describe('diagramHref', () => {
  it('links to the real diagram page when built', () => {
    const href = diagramHref(
      { slug: 'microeconomics' },
      { slug: 'government-intervention' },
      { slug: 'price-ceiling', status: 'built' }
    );
    expect(href).toBe('/units/microeconomics/government-intervention/price-ceiling.html');
  });

  it('links to the WIP stub, tagged with the diagram slug, when not built', () => {
    const href = diagramHref(
      { slug: 'microeconomics' },
      { slug: 'government-intervention' },
      { slug: 'agricultural-markets', status: 'coming-soon' }
    );
    expect(href).toBe('/units/wip.html?unit=agricultural-markets');
  });
});
```

Also update the two existing tests that hardcode Microeconomics as `coming-soon`/WIP-linked, since it is now built:

Replace:
```js
  it('marks every unit as coming-soon, since no real subpage exists yet', () => {
    getUnits().forEach((unit) => {
      expect(unit.status).toBe('coming-soon');
    });
  });
```
with:
```js
  it('marks microeconomics as built and the other three units as coming-soon', () => {
    const byStatus = Object.fromEntries(getUnits().map((u) => [u.slug, u.status]));
    expect(byStatus.microeconomics).toBe('built');
    expect(byStatus.macroeconomics).toBe('coming-soon');
    expect(byStatus.international).toBe('coming-soon');
    expect(byStatus.development).toBe('coming-soon');
  });
```

And replace:
```js
describe('unitHref', () => {
  it('points to the generic work-in-progress stub with the unit slug as a query param', () => {
    expect(unitHref({ slug: 'microeconomics' })).toBe('/units/wip.html?unit=microeconomics');
  });

  it('honors an explicit base path, so links still work under a GitHub Pages project subpath', () => {
    expect(unitHref({ slug: 'microeconomics' }, '/econ-tools/')).toBe(
      '/econ-tools/units/wip.html?unit=microeconomics'
    );
  });
});
```
with:
```js
describe('unitHref', () => {
  it('points to the generic work-in-progress stub with the unit slug as a query param, for a coming-soon unit', () => {
    expect(unitHref({ slug: 'macroeconomics', status: 'coming-soon' })).toBe('/units/wip.html?unit=macroeconomics');
  });

  it('honors an explicit base path, so links still work under a GitHub Pages project subpath', () => {
    expect(unitHref({ slug: 'macroeconomics', status: 'coming-soon' }, '/econ-tools/')).toBe(
      '/econ-tools/units/wip.html?unit=macroeconomics'
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/units.test.js`
Expected: FAIL — `families` is undefined, `familyHref`/`diagramHref` don't exist, Microeconomics still reports `coming-soon`.

- [ ] **Step 3: Rewrite `units.js`**

```js
// src/lib/units.js
const UNITS = [
  {
    slug: 'microeconomics',
    name: 'Microeconomics',
    tier: 'large',
    status: 'built',
    tags: ['supply', 'demand', 'elasticity', 'market failure', 'government intervention', 'minimum wage', 'price ceiling', 'price floor'],
    families: [
      {
        slug: 'demand-and-supply',
        name: 'Demand & Supply',
        status: 'coming-soon',
        diagrams: [
          { slug: 'demand-curve', name: 'Demand curve', level: 'SL', status: 'coming-soon', tags: ['demand shift', 'movement along demand'] },
          { slug: 'supply-curve', name: 'Supply curve', level: 'SL', status: 'coming-soon', tags: ['supply shift', 'movement along supply'] },
          { slug: 'market-equilibrium', name: 'Market equilibrium', level: 'SL', status: 'coming-soon', tags: ['equilibrium price', 'market clearing'] },
          { slug: 'consumer-producer-surplus', name: 'Consumer & producer surplus', level: 'SL', status: 'coming-soon', tags: ['consumer surplus', 'producer surplus'] },
          { slug: 'allocative-efficiency', name: 'Allocative efficiency', level: 'SL', status: 'coming-soon', tags: ['allocative efficiency'] },
        ],
      },
      {
        slug: 'elasticity',
        name: 'Elasticity',
        status: 'coming-soon',
        diagrams: [
          { slug: 'ped', name: 'Price elasticity of demand', level: 'SL', status: 'coming-soon', tags: ['ped', 'elastic', 'inelastic', 'total revenue'] },
          { slug: 'pes', name: 'Price elasticity of supply', level: 'SL', status: 'coming-soon', tags: ['pes'] },
          { slug: 'yed-xed', name: 'Income & cross elasticity', level: 'SL', status: 'coming-soon', tags: ['yed', 'xed', 'engel curve'] },
        ],
      },
      {
        slug: 'government-intervention',
        name: 'Government Intervention',
        status: 'built',
        diagrams: [
          { slug: 'price-ceiling', name: 'Price ceiling', level: 'SL', status: 'built', tags: ['price ceiling', 'rent control', 'shortage', 'deadweight loss'] },
          { slug: 'price-floor', name: 'Price floor', level: 'SL', status: 'built', tags: ['price floor', 'minimum wage', 'surplus', 'deadweight loss'] },
          { slug: 'indirect-tax', name: 'Indirect tax', level: 'SL', status: 'built', tags: ['indirect tax', 'specific tax', 'ad valorem tax', 'tax incidence', 'tax revenue'] },
          { slug: 'subsidy', name: 'Subsidy', level: 'SL', status: 'built', tags: ['subsidy', 'government spending'] },
          { slug: 'agricultural-markets', name: 'Agricultural markets', level: 'SL', status: 'coming-soon', tags: ['buffer stock', 'price support'] },
        ],
      },
      {
        slug: 'market-failure',
        name: 'Market Failure',
        status: 'coming-soon',
        diagrams: [
          { slug: 'negative-production-externality', name: 'Negative externality of production', level: 'SL', status: 'coming-soon', tags: ['pollution', 'msc', 'mpc'] },
          { slug: 'negative-consumption-externality', name: 'Negative externality of consumption', level: 'SL', status: 'coming-soon', tags: ['demerit good', 'msb', 'mpb'] },
          { slug: 'positive-production-externality', name: 'Positive externality of production', level: 'SL', status: 'coming-soon', tags: ['spillover benefit'] },
          { slug: 'positive-consumption-externality', name: 'Positive externality of consumption', level: 'SL', status: 'coming-soon', tags: ['merit good'] },
          { slug: 'common-resources', name: 'Common resources / tragedy of the commons', level: 'SL', status: 'coming-soon', tags: ['tragedy of the commons'] },
          { slug: 'public-goods', name: 'Public goods', level: 'SL', status: 'coming-soon', tags: ['free rider', 'non-excludable'] },
        ],
      },
      {
        slug: 'theory-of-the-firm',
        name: 'Theory of the Firm',
        status: 'coming-soon',
        diagrams: [
          { slug: 'cost-curves', name: 'Short-run & long-run cost curves', level: 'HL', status: 'coming-soon', tags: ['economies of scale', 'minimum efficient scale'] },
          { slug: 'revenue-curves', name: 'Revenue curves', level: 'HL', status: 'coming-soon', tags: ['ar', 'mr'] },
          { slug: 'perfect-competition', name: 'Perfect competition', level: 'HL', status: 'coming-soon', tags: ['normal profit', 'abnormal profit', 'loss'] },
          { slug: 'monopoly', name: 'Monopoly', level: 'HL', status: 'coming-soon', tags: ['welfare loss', 'natural monopoly'] },
          { slug: 'monopolistic-competition', name: 'Monopolistic competition', level: 'HL', status: 'coming-soon', tags: [] },
          { slug: 'oligopoly', name: 'Oligopoly', level: 'HL', status: 'coming-soon', tags: ['kinked demand', 'game theory', 'collusion'] },
          { slug: 'price-discrimination', name: 'Price discrimination', level: 'HL', status: 'coming-soon', tags: ['first degree', 'third degree'] },
        ],
      },
    ],
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
  if (unit.status === 'built') return `${base}units/${unit.slug}.html`;
  return `${base}units/wip.html?unit=${unit.slug}`;
}

export function familyHref(unit, family, base = import.meta.env.BASE_URL) {
  if (family.status === 'built') return `${base}units/${unit.slug}/${family.slug}.html`;
  return `${base}units/wip.html?unit=${family.slug}`;
}

export function diagramHref(unit, family, diagram, base = import.meta.env.BASE_URL) {
  if (diagram.status === 'built') return `${base}units/${unit.slug}/${family.slug}/${diagram.slug}.html`;
  return `${base}units/wip.html?unit=${diagram.slug}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/units.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/units.js src/lib/units.test.js
git commit -m "feat: nest microeconomics families and diagrams in the units data model"
```

---

### Task 6: Generalize `bento.js` for family/diagram tiles + SL/HL badge

**Files:**
- Modify: `src/components/bento.js`
- Modify: `src/components/bento.test.js`

**Interfaces:**
- Produces: `renderBento(container, items, options)`. `items` are now `{ name, tier?, status, href, level? }` — **`href` is now required on each item** (callers compute it via `unitHref`/`familyHref`/`diagramHref` before calling), replacing the old internal `unitHref()` call. When `options.tiered` is `false` (default `true`), tiles render without a `bento__tile--<tier>` size class (used for family/diagram grids, which are uniform, not asymmetric like the homepage). Renders a `.level-pill` badge when `item.level` is set.
- Consumes: nothing from `units.js` directly anymore (decoupled — the caller passes `href` in).

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `src/components/bento.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { renderBento } from './bento.js';

function homepageUnits() {
  return [
    { name: 'Microeconomics', tier: 'large', status: 'built', href: '/units/microeconomics.html' },
    { name: 'Macroeconomics', tier: 'medium', status: 'coming-soon', href: '/units/wip.html?unit=macroeconomics' },
  ];
}

describe('renderBento', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders one real anchor tile per item, using the precomputed href, so keyboard and right-click navigation both work', () => {
    renderBento(container, homepageUnits());
    const tiles = container.querySelectorAll('a.bento__tile');
    expect(tiles).toHaveLength(2);
    expect(tiles[0].getAttribute('href')).toBe('/units/microeconomics.html');
  });

  it('applies the tier as a CSS class by default', () => {
    renderBento(container, homepageUnits());
    const micro = container.querySelector('a[href="/units/microeconomics.html"]');
    expect(micro.className).toContain('bento__tile--large');
  });

  it('omits the tier class when options.tiered is false, for uniform family/diagram grids', () => {
    renderBento(container, [{ name: 'Price ceiling', status: 'built', href: '/units/microeconomics/government-intervention/price-ceiling.html', level: 'SL' }], { tiered: false });
    const tile = container.querySelector('a.bento__tile');
    expect(tile.className).not.toMatch(/bento__tile--/);
  });

  it('renders zero tiles for an empty item list, without throwing', () => {
    expect(() => renderBento(container, [])).not.toThrow();
    expect(container.querySelectorAll('a.bento__tile')).toHaveLength(0);
  });

  it('shows a "coming soon" badge on tiles whose item is not built yet, so the page stays honest about completeness', () => {
    renderBento(container, [{ name: 'Macroeconomics', tier: 'medium', status: 'coming-soon', href: '/units/wip.html?unit=macroeconomics' }]);
    const badge = container.querySelector('a.bento__tile .bento__badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('Coming soon');
  });

  it('omits the coming-soon badge for a built item', () => {
    renderBento(container, [{ name: 'Microeconomics', tier: 'large', status: 'built', href: '/units/microeconomics.html' }]);
    expect(container.querySelector('a.bento__tile .bento__badge')).toBeNull();
  });

  it('renders a level pill when the item has a level, for SL/HL diagram tiles', () => {
    renderBento(container, [{ name: 'Price ceiling', status: 'built', href: '/x.html', level: 'SL' }], { tiered: false });
    const pill = container.querySelector('a.bento__tile .level-pill');
    expect(pill).not.toBeNull();
    expect(pill.textContent).toBe('SL');
  });

  it('omits the level pill when the item has no level', () => {
    renderBento(container, homepageUnits());
    expect(container.querySelector('a.bento__tile .level-pill')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/bento.test.js`
Expected: FAIL — `renderBento` still calls `unitHref` internally and ignores `options`.

- [ ] **Step 3: Rewrite `bento.js`**

```js
// src/components/bento.js
export function renderBento(container, items, options = {}) {
  const tiered = options.tiered !== false;
  container.innerHTML = '';
  container.className = 'bento';
  items.forEach((item) => {
    const tile = document.createElement('a');
    tile.href = item.href;
    tile.className = tiered && item.tier ? `bento__tile bento__tile--${item.tier}` : 'bento__tile';
    const badge = item.status === 'coming-soon' ? '<span class="bento__badge">Coming soon</span>' : '';
    const levelPill = item.level ? `<span class="level-pill">${item.level}</span>` : '';
    tile.innerHTML = `${badge}${levelPill}<h3>${item.name}</h3>`;
    container.appendChild(tile);
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/bento.test.js`
Expected: PASS

- [ ] **Step 5: Update `home.js` for the new `renderBento` contract**

`home.js` must now precompute each unit's `href` before calling `renderBento` (previously `bento.js` computed it internally via `unitHref`). Update `src/pages/home.js`:

```js
// src/pages/home.js
import { renderHero } from '../components/chrome.js';
import { renderBento } from '../components/bento.js';
import { filterGraphs } from '../components/search.js';
import { getUnits, unitHref } from '../lib/units.js';

function withHrefs(units) {
  return units.map((unit) => ({ ...unit, href: unitHref(unit) }));
}

export function initHomePage(doc) {
  const heroEl = doc.querySelector('#hero');
  const bentoEl = doc.querySelector('#bento');
  const searchInput = doc.querySelector('#search-input');
  const noResultsEl = doc.querySelector('#no-results');

  renderHero(heroEl, {
    eyebrow: 'IB ECONOMICS · INTERACTIVE GRAPHS',
    title: 'Understand the graph, not just the answer',
    lede: 'Interactive diagrams built for IB Economics revision — see how each intervention changes the market, not just the finished picture.',
  });

  const units = getUnits();
  renderBento(bentoEl, withHrefs(units));

  searchInput.addEventListener('input', () => {
    const results = filterGraphs(searchInput.value, units);
    renderBento(bentoEl, withHrefs(results));
    noResultsEl.hidden = results.length !== 0;
  });
}
```

Update `src/pages/home.test.js` and `src/pages/home.integration.test.js`: everywhere they assert `a.bento__tile` hrefs matched `/units/wip.html?unit=...`, the Microeconomics tile now resolves to `/units/microeconomics.html` instead. Update the count-based assertions (`toHaveLength(4)`, `toHaveLength(1)` for a "micro" search) — those counts are unchanged since the same 4 units still render, only Microeconomics' href changed. Add one assertion to `home.test.js` confirming the new href:

```js
  it('links the Microeconomics tile to its real unit page, not the WIP stub', () => {
    const link = document.querySelector('a[href="/units/microeconomics.html"]');
    expect(link).not.toBeNull();
  });
```

- [ ] **Step 6: Run the full test suite to verify nothing else broke**

Run: `npx vitest run`
Expected: PASS across all files.

- [ ] **Step 7: Commit**

```bash
git add src/components/bento.js src/components/bento.test.js src/pages/home.js src/pages/home.test.js src/pages/home.integration.test.js
git commit -m "feat: decouple bento tiles from unitHref, add level-pill and untiered mode"
```

---

### Task 7: Per-unit accent color token

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/tokens.test.js`
- Modify: `src/styles/pages.css` (apply the token to the large tile instead of the generic demand token)

**Interfaces:**
- Produces: CSS custom property `--unit-microeconomics` (aliased to `--demand`) in both the light block and both dark blocks of `tokens.css`.

- [ ] **Step 1: Write the failing test**

Add to `src/styles/tokens.test.js`:

```js
  it('defines a microeconomics unit accent token, independent of tile tier', () => {
    const css = readTokensCss();
    expect(css).toContain('--unit-microeconomics:');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/styles/tokens.test.js`
Expected: FAIL

- [ ] **Step 3: Add the token to all three blocks of `tokens.css`**

In the `:root { ... }` block, immediately after the `--demand-tick:` line, add:
```css
    --unit-microeconomics: var(--demand);
```
Add the identical line in the same position inside `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` and inside `:root[data-theme="dark"] { ... }` (both already redefine `--demand` for dark mode, so `var(--demand)` picks up the correct dark value automatically in each block).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/styles/tokens.test.js`
Expected: PASS

- [ ] **Step 5: Point the homepage's large tile at the unit token instead of the generic demand token**

In `src/styles/pages.css`, change:
```css
.bento__tile--large {
  grid-column: span 2;
  grid-row: span 2;
  background: var(--demand-fill);
  border-color: var(--demand);
}
```
to:
```css
.bento__tile--large {
  grid-column: span 2;
  grid-row: span 2;
  background: var(--demand-fill);
  border-color: var(--unit-microeconomics);
}
```
(Same visual result today since `--unit-microeconomics` aliases `--demand` — this makes the coupling to "Microeconomics' identity" explicit rather than "large tier happens to be blue", per the spec decision. No test changes needed here; the visual result is unchanged and covered by the existing bento test.)

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css src/styles/tokens.test.js src/styles/pages.css
git commit -m "feat: add per-unit accent token, decoupling Microeconomics blue from tile tier"
```

---

### Task 8: Microeconomics unit page

**Files:**
- Create: `units/microeconomics.html`
- Create: `src/pages/microeconomics.js`, `src/pages/microeconomics-entry.js`
- Create: `src/pages/microeconomics.test.js`, `src/pages/microeconomics.integration.test.js`

**Interfaces:**
- Consumes: `getUnits`, `familyHref` from `src/lib/units.js`; `renderMiniHeader`, `renderHero` from `src/components/chrome.js`; `renderBento` from `src/components/bento.js`.
- Produces: `initMicroeconomicsPage(doc)`.

- [ ] **Step 1: Write the failing unit test**

```js
// src/pages/microeconomics.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initMicroeconomicsPage } from './microeconomics.js';

describe('initMicroeconomicsPage', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="mini-header"></div>
      <div id="hero"></div>
      <div id="family-bento"></div>
    `;
    initMicroeconomicsPage(document);
  });

  it('renders one tile per topic family', () => {
    expect(document.querySelectorAll('#family-bento a.bento__tile')).toHaveLength(5);
  });

  it('links the built Government Intervention family to its real page', () => {
    const link = document.querySelector('a[href="/units/microeconomics/government-intervention.html"]');
    expect(link).not.toBeNull();
    expect(link.querySelector('.bento__badge')).toBeNull();
  });

  it('links every other family to the WIP stub, tagged with its own slug', () => {
    const link = document.querySelector('a[href="/units/wip.html?unit=demand-and-supply"]');
    expect(link).not.toBeNull();
    expect(link.querySelector('.bento__badge')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/microeconomics.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `microeconomics.js`**

```js
// src/pages/microeconomics.js
import { renderMiniHeader, renderHero } from '../components/chrome.js';
import { renderBento } from '../components/bento.js';
import { getUnits, familyHref } from '../lib/units.js';

export function initMicroeconomicsPage(doc) {
  const unit = getUnits().find((u) => u.slug === 'microeconomics');

  renderMiniHeader(doc.querySelector('#mini-header'), { title: unit.name });
  renderHero(doc.querySelector('#hero'), {
    eyebrow: 'MICROECONOMICS',
    title: unit.name,
    lede: 'Pick a topic family to find the graph you need — each one opens straight to a focused, interactive diagram.',
  });

  const families = unit.families.map((family) => ({
    name: family.name,
    status: family.status,
    href: familyHref(unit, family),
  }));
  renderBento(doc.querySelector('#family-bento'), families, { tiered: false });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/microeconomics.test.js`
Expected: PASS

- [ ] **Step 5: Create the entry script, HTML page, and integration test**

```js
// src/pages/microeconomics-entry.js
import { initMicroeconomicsPage } from './microeconomics.js';
initMicroeconomicsPage(document);
```

```html
<!-- units/microeconomics.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Microeconomics — IB Economics Graphs</title>
  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/pages.css">
</head>
<body>
  <main class="page">
    <div id="mini-header"></div>
    <div id="hero"></div>
    <div id="family-bento"></div>
  </main>
  <script type="module" src="/src/pages/microeconomics-entry.js"></script>
</body>
</html>
```

```js
// src/pages/microeconomics.integration.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initMicroeconomicsPage } from './microeconomics.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initMicroeconomicsPage against the real units/microeconomics.html markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
    initMicroeconomicsPage(document);
  });

  it('wires up against the real ids without throwing, and renders all 5 family tiles', () => {
    expect(document.querySelectorAll('#family-bento a.bento__tile')).toHaveLength(5);
  });
});
```

- [ ] **Step 6: Run the integration test to verify it passes**

Run: `npx vitest run src/pages/microeconomics.integration.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add units/microeconomics.html src/pages/microeconomics.js src/pages/microeconomics-entry.js src/pages/microeconomics.test.js src/pages/microeconomics.integration.test.js
git commit -m "feat: add Microeconomics unit page with family bento"
```

---

### Task 9: Government Intervention family page

**Files:**
- Create: `units/microeconomics/government-intervention.html`
- Create: `src/pages/government-intervention.js`, `src/pages/government-intervention-entry.js`
- Create: `src/pages/government-intervention.test.js`, `src/pages/government-intervention.integration.test.js`

**Interfaces:**
- Consumes: same chrome/bento/units helpers as Task 8, but at the family→diagram level via `diagramHref`.
- Produces: `initGovernmentInterventionPage(doc)`.

- [ ] **Step 1: Write the failing unit test**

```js
// src/pages/government-intervention.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initGovernmentInterventionPage } from './government-intervention.js';

describe('initGovernmentInterventionPage', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="mini-header"></div>
      <div id="hero"></div>
      <div id="diagram-bento"></div>
    `;
    initGovernmentInterventionPage(document);
  });

  it('renders one tile per diagram in the family', () => {
    expect(document.querySelectorAll('#diagram-bento a.bento__tile')).toHaveLength(5);
  });

  it('links the four built diagrams to their real pages with an SL pill', () => {
    const link = document.querySelector('a[href="/units/microeconomics/government-intervention/price-ceiling.html"]');
    expect(link).not.toBeNull();
    expect(link.querySelector('.level-pill').textContent).toBe('SL');
    expect(link.querySelector('.bento__badge')).toBeNull();
  });

  it('links the not-yet-built agricultural markets diagram to the WIP stub', () => {
    const link = document.querySelector('a[href="/units/wip.html?unit=agricultural-markets"]');
    expect(link).not.toBeNull();
    expect(link.querySelector('.bento__badge')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/government-intervention.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `government-intervention.js`**

```js
// src/pages/government-intervention.js
import { renderMiniHeader, renderHero } from '../components/chrome.js';
import { renderBento } from '../components/bento.js';
import { getUnits, diagramHref } from '../lib/units.js';

export function initGovernmentInterventionPage(doc) {
  const unit = getUnits().find((u) => u.slug === 'microeconomics');
  const family = unit.families.find((f) => f.slug === 'government-intervention');

  renderMiniHeader(doc.querySelector('#mini-header'), { title: family.name });
  renderHero(doc.querySelector('#hero'), {
    eyebrow: 'MICROECONOMICS · GOVERNMENT INTERVENTION',
    title: family.name,
    lede: 'See how each policy tool moves the market away from its free-market equilibrium — and what that costs in deadweight loss.',
  });

  const diagrams = family.diagrams.map((diagram) => ({
    name: diagram.name,
    status: diagram.status,
    level: diagram.level,
    href: diagramHref(unit, family, diagram),
  }));
  renderBento(doc.querySelector('#diagram-bento'), diagrams, { tiered: false });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/government-intervention.test.js`
Expected: PASS

- [ ] **Step 5: Create the entry script, HTML page, and integration test**

```js
// src/pages/government-intervention-entry.js
import { initGovernmentInterventionPage } from './government-intervention.js';
initGovernmentInterventionPage(document);
```

```html
<!-- units/microeconomics/government-intervention.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Government Intervention — Microeconomics — IB Economics Graphs</title>
  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/pages.css">
</head>
<body>
  <main class="page">
    <div id="mini-header"></div>
    <div id="hero"></div>
    <div id="diagram-bento"></div>
  </main>
  <script type="module" src="/src/pages/government-intervention-entry.js"></script>
</body>
</html>
```

```js
// src/pages/government-intervention.integration.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initGovernmentInterventionPage } from './government-intervention.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initGovernmentInterventionPage against the real family page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
    initGovernmentInterventionPage(document);
  });

  it('wires up against the real ids without throwing, and renders all 5 diagram tiles', () => {
    expect(document.querySelectorAll('#diagram-bento a.bento__tile')).toHaveLength(5);
  });
});
```

- [ ] **Step 6: Run the integration test to verify it passes**

Run: `npx vitest run src/pages/government-intervention.integration.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add units/microeconomics/government-intervention.html src/pages/government-intervention.js src/pages/government-intervention-entry.js src/pages/government-intervention.test.js src/pages/government-intervention.integration.test.js
git commit -m "feat: add Government Intervention family page with diagram bento"
```

---

### Task 10: Price Ceiling diagram page

**Files:**
- Create: `units/microeconomics/government-intervention/price-ceiling.html`
- Create: `src/pages/price-ceiling.js`, `src/pages/price-ceiling-entry.js`
- Create: `src/pages/price-ceiling.test.js`, `src/pages/price-ceiling.integration.test.js`

**Interfaces:**
- Consumes: `computeMarket` (Task 2), `renderMarketChart` (Task 4), `fmtMoney`/`fmtPrice`/`fmtQty` (Task 3), `renderMiniHeader` (existing).
- Produces: `initPriceCeilingPage(doc)`.

**Design note:** every diagram page in this family follows the same wiring shape — read sliders/toggle → call `computeMarket` → call `renderMarketChart` → write the stats panel text directly by element id. This page is the reference implementation; Tasks 11–13 repeat the same shape with different controls.

- [ ] **Step 1: Write the failing unit test**

```js
// src/pages/price-ceiling.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initPriceCeilingPage } from './price-ceiling.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="mini-header"></div>
    <svg id="chart" class="market-chart"></svg>
    <span id="status-pill"></span>
    <input id="demand-slider" type="range" min="70" max="170" step="1" value="140">
    <span id="demand-val"></span>
    <input id="supply-slider" type="range" min="-10" max="110" step="1" value="20">
    <span id="supply-val"></span>
    <input id="ceiling-toggle" type="checkbox">
    <input id="ceiling-slider" type="range" min="0" max="180" step="1" value="50">
    <span id="ceiling-val"></span>
    <button id="reset-btn" type="button"></button>
    <span id="stat-price"></span>
    <span id="stat-qty"></span>
    <span id="stat-cs"></span>
    <span id="stat-ps"></span>
    <span id="stat-dwl"></span>
    <div id="market-note"></div>
  `;
}

describe('initPriceCeilingPage', () => {
  beforeEach(() => {
    buildDom();
    initPriceCeilingPage(document);
  });

  it('renders the free-market baseline stats with the ceiling toggled off', () => {
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('60.0');
    expect(document.querySelector('#stat-dwl').textContent).toBe('$0');
  });

  it('shows the binding-ceiling stats once the toggle is switched on', () => {
    document.querySelector('#ceiling-toggle').checked = true;
    document.querySelector('#ceiling-toggle').dispatchEvent(new Event('change'));
    expect(document.querySelector('#stat-price').textContent).toBe('$50.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('30.0');
    expect(document.querySelector('#stat-dwl').textContent).toBe('$900');
    expect(document.querySelector('#status-pill').textContent).toBe('Price ceiling binding');
  });

  it('draws demand and supply curves onto the chart', () => {
    expect(document.querySelectorAll('#chart line.demand-curve')).toHaveLength(1);
  });

  it('resets sliders and toggle to their defaults on reset', () => {
    document.querySelector('#ceiling-toggle').checked = true;
    document.querySelector('#ceiling-toggle').dispatchEvent(new Event('change'));
    document.querySelector('#reset-btn').click();
    expect(document.querySelector('#ceiling-toggle').checked).toBe(false);
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/price-ceiling.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `price-ceiling.js`**

```js
// src/pages/price-ceiling.js
import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty } from '../lib/format.js';

const DEFAULTS = { demand: 140, supply: 20, ceilingOn: false, ceilingPrice: 50 };

export function initPriceCeilingPage(doc) {
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Price ceiling' });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const ceilingToggle = doc.querySelector('#ceiling-toggle');
  const ceilingSlider = doc.querySelector('#ceiling-slider');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const ceilingOn = ceilingToggle.checked;
    const ceilingPrice = +ceilingSlider.value;

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#ceiling-val').textContent = '$' + ceilingPrice;

    const intervention = ceilingOn ? { type: 'ceiling', price: ceilingPrice } : { type: 'none' };
    const result = computeMarket({ demand, supply, slopeD: 1, slopeS: 1, intervention });

    renderMarketChart(chart, result);

    const pill = doc.querySelector('#status-pill');
    pill.textContent = result.mode === 'ceiling' ? 'Price ceiling binding' : 'Free market';

    doc.querySelector('#stat-price').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-cs').textContent = result.noTrade ? '$0' : fmtMoney(result.CS);
    doc.querySelector('#stat-ps').textContent = result.noTrade ? '$0' : fmtMoney(result.PS);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    const note = doc.querySelector('#market-note');
    if (result.noTrade) {
      note.innerHTML = '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.';
    } else if (result.mode === 'ceiling') {
      note.innerHTML = `<strong>${fmtQty(result.gap)} units of shortage.</strong> Buyers want more than sellers are willing to provide at this price — expect queues or rationing.`;
    } else {
      note.innerHTML = 'Equilibrium price and quantity — every mutually beneficial trade happens.';
    }
  }

  [demandSlider, supplySlider, ceilingSlider].forEach((input) => input.addEventListener('input', render));
  ceilingToggle.addEventListener('change', render);

  doc.querySelector('#reset-btn').addEventListener('click', () => {
    demandSlider.value = DEFAULTS.demand;
    supplySlider.value = DEFAULTS.supply;
    ceilingToggle.checked = DEFAULTS.ceilingOn;
    ceilingSlider.value = DEFAULTS.ceilingPrice;
    render();
  });

  render();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/price-ceiling.test.js`
Expected: PASS

- [ ] **Step 5: Create entry script, HTML page (full markup with sidebar controls), and integration test**

```js
// src/pages/price-ceiling-entry.js
import { initPriceCeilingPage } from './price-ceiling.js';
initPriceCeilingPage(document);
```

```html
<!-- units/microeconomics/government-intervention/price-ceiling.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Price Ceiling — Microeconomics — IB Economics Graphs</title>
  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/pages.css">
</head>
<body>
  <main class="page">
    <div id="mini-header"></div>
    <header class="top">
      <span class="eyebrow">Interactive · Microeconomics <span class="level-pill">SL</span></span>
      <h1>Price ceiling</h1>
      <p class="lede">Impose a legal maximum price below equilibrium and watch the shortage — and the deadweight loss it creates — appear in real time.</p>
    </header>
    <div class="layout">
      <section class="card chart-card">
        <div class="chart-head">
          <h2 class="chart-title">Price &amp; quantity</h2>
          <span class="status-pill" id="status-pill">Free market</span>
        </div>
        <svg id="chart" class="market-chart" viewBox="0 0 780 520" role="img" aria-label="Price ceiling diagram"></svg>
        <div class="legend">
          <span class="item"><span class="line" style="background:var(--demand)"></span>Demand</span>
          <span class="item"><span class="line" style="background:var(--supply)"></span>Supply</span>
          <span class="item"><span class="swatch" style="background:var(--demand-fill); border:1px solid var(--demand)"></span>Consumer surplus</span>
          <span class="item"><span class="swatch" style="background:var(--supply-fill); border:1px solid var(--supply)"></span>Producer surplus</span>
          <span class="item"><span class="swatch" style="background:var(--dwl-fill); border:1px solid var(--dwl-line)"></span>Deadweight loss</span>
        </div>
      </section>
      <aside class="sidebar">
        <section class="card panel">
          <h2>Shift the curves</h2>
          <div class="slider-row">
            <div class="slider-label"><span>Demand</span><span class="val" id="demand-val">140</span></div>
            <input type="range" id="demand-slider" min="70" max="170" step="1" value="140">
          </div>
          <div class="slider-row">
            <div class="slider-label"><span>Supply</span><span class="val" id="supply-val">20</span></div>
            <input type="range" id="supply-slider" min="-10" max="110" step="1" value="20">
          </div>
          <button id="reset-btn" class="reset-btn" type="button">Reset to defaults</button>
        </section>
        <section class="card panel">
          <h2>Price ceiling</h2>
          <div class="toggle-row">
            <span class="label">Impose ceiling<span class="sub">e.g. rent control</span></span>
            <label class="switch">
              <input type="checkbox" id="ceiling-toggle">
              <span class="track"></span><span class="thumb"></span>
            </label>
          </div>
          <div class="slider-row" style="margin-top:12px">
            <div class="slider-label"><span>Ceiling price</span><span class="val" id="ceiling-val">$50</span></div>
            <input type="range" id="ceiling-slider" min="0" max="180" step="1" value="50">
          </div>
        </section>
        <section class="card panel">
          <h2>Market outcome</h2>
          <div class="stats-grid">
            <div class="stat"><div class="k">Price</div><div class="v" id="stat-price">$80.00</div></div>
            <div class="stat"><div class="k">Quantity traded</div><div class="v" id="stat-qty">60.0</div></div>
            <div class="stat cs"><div class="k">Consumer surplus</div><div class="v" id="stat-cs">$1,800</div></div>
            <div class="stat ps"><div class="k">Producer surplus</div><div class="v" id="stat-ps">$1,800</div></div>
            <div class="stat dwl wide"><div class="k">Deadweight loss</div><div class="v" id="stat-dwl">$0</div></div>
          </div>
          <div class="note" id="market-note">Equilibrium price and quantity — every mutually beneficial trade happens.</div>
        </section>
      </aside>
    </div>
  </main>
  <script type="module" src="/src/pages/price-ceiling-entry.js"></script>
</body>
</html>
```

```js
// src/pages/price-ceiling.integration.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initPriceCeilingPage } from './price-ceiling.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initPriceCeilingPage against the real page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention', 'price-ceiling.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
  });

  it('wires up against the real ids without throwing, and shows the free-market baseline', () => {
    expect(() => initPriceCeilingPage(document)).not.toThrow();
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
  });
});
```

- [ ] **Step 6: Run the integration test to verify it passes**

Run: `npx vitest run src/pages/price-ceiling.integration.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add units/microeconomics/government-intervention/price-ceiling.html src/pages/price-ceiling.js src/pages/price-ceiling-entry.js src/pages/price-ceiling.test.js src/pages/price-ceiling.integration.test.js
git commit -m "feat: add Price Ceiling diagram page"
```

---

### Task 11: Price Floor diagram page

**Files:**
- Create: `units/microeconomics/government-intervention/price-floor.html`
- Create: `src/pages/price-floor.js`, `src/pages/price-floor-entry.js`
- Create: `src/pages/price-floor.test.js`, `src/pages/price-floor.integration.test.js`

**Interfaces:** identical shape to Task 10, mirrored for floor. Same consumes/produces pattern (`initPriceFloorPage(doc)`).

- [ ] **Step 1: Write the failing unit test**

Copy `src/pages/price-ceiling.test.js` to `src/pages/price-floor.test.js` and adapt: rename `initPriceCeilingPage` → `initPriceFloorPage`, `ceiling-toggle`/`ceiling-slider`/`ceiling-val` → `floor-toggle`/`floor-slider`/`floor-val` (default value `110`, range `min="0" max="180"`), and change the expected numbers to the floor case from Task 2's tests:

```js
// src/pages/price-floor.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initPriceFloorPage } from './price-floor.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="mini-header"></div>
    <svg id="chart" class="market-chart"></svg>
    <span id="status-pill"></span>
    <input id="demand-slider" type="range" min="70" max="170" step="1" value="140">
    <span id="demand-val"></span>
    <input id="supply-slider" type="range" min="-10" max="110" step="1" value="20">
    <span id="supply-val"></span>
    <input id="floor-toggle" type="checkbox">
    <input id="floor-slider" type="range" min="0" max="180" step="1" value="110">
    <span id="floor-val"></span>
    <button id="reset-btn" type="button"></button>
    <span id="stat-price"></span>
    <span id="stat-qty"></span>
    <span id="stat-cs"></span>
    <span id="stat-ps"></span>
    <span id="stat-dwl"></span>
    <div id="market-note"></div>
  `;
}

describe('initPriceFloorPage', () => {
  beforeEach(() => {
    buildDom();
    initPriceFloorPage(document);
  });

  it('renders the free-market baseline stats with the floor toggled off', () => {
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
    expect(document.querySelector('#stat-dwl').textContent).toBe('$0');
  });

  it('shows the binding-floor stats once the toggle is switched on', () => {
    document.querySelector('#floor-toggle').checked = true;
    document.querySelector('#floor-toggle').dispatchEvent(new Event('change'));
    expect(document.querySelector('#stat-price').textContent).toBe('$110.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('30.0');
    expect(document.querySelector('#stat-dwl').textContent).toBe('$900');
    expect(document.querySelector('#status-pill').textContent).toBe('Price floor binding');
  });

  it('resets sliders and toggle to their defaults on reset', () => {
    document.querySelector('#floor-toggle').checked = true;
    document.querySelector('#floor-toggle').dispatchEvent(new Event('change'));
    document.querySelector('#reset-btn').click();
    expect(document.querySelector('#floor-toggle').checked).toBe(false);
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/price-floor.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `price-floor.js`**

```js
// src/pages/price-floor.js
import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty } from '../lib/format.js';

const DEFAULTS = { demand: 140, supply: 20, floorOn: false, floorPrice: 110 };

export function initPriceFloorPage(doc) {
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Price floor' });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const floorToggle = doc.querySelector('#floor-toggle');
  const floorSlider = doc.querySelector('#floor-slider');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const floorOn = floorToggle.checked;
    const floorPrice = +floorSlider.value;

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#floor-val').textContent = '$' + floorPrice;

    const intervention = floorOn ? { type: 'floor', price: floorPrice } : { type: 'none' };
    const result = computeMarket({ demand, supply, slopeD: 1, slopeS: 1, intervention });

    renderMarketChart(chart, result);

    const pill = doc.querySelector('#status-pill');
    pill.textContent = result.mode === 'floor' ? 'Price floor binding' : 'Free market';

    doc.querySelector('#stat-price').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-cs').textContent = result.noTrade ? '$0' : fmtMoney(result.CS);
    doc.querySelector('#stat-ps').textContent = result.noTrade ? '$0' : fmtMoney(result.PS);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    const note = doc.querySelector('#market-note');
    if (result.noTrade) {
      note.innerHTML = '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.';
    } else if (result.mode === 'floor') {
      note.innerHTML = `<strong>${fmtQty(result.gap)} units go unsold.</strong> Sellers want to supply more than buyers demand at this price.`;
    } else {
      note.innerHTML = 'Equilibrium price and quantity — every mutually beneficial trade happens.';
    }
  }

  [demandSlider, supplySlider, floorSlider].forEach((input) => input.addEventListener('input', render));
  floorToggle.addEventListener('change', render);

  doc.querySelector('#reset-btn').addEventListener('click', () => {
    demandSlider.value = DEFAULTS.demand;
    supplySlider.value = DEFAULTS.supply;
    floorToggle.checked = DEFAULTS.floorOn;
    floorSlider.value = DEFAULTS.floorPrice;
    render();
  });

  render();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/price-floor.test.js`
Expected: PASS

- [ ] **Step 5: Create entry script, HTML page, and integration test**

```js
// src/pages/price-floor-entry.js
import { initPriceFloorPage } from './price-floor.js';
initPriceFloorPage(document);
```

Create `units/microeconomics/government-intervention/price-floor.html` by copying `price-ceiling.html` (Task 10) and adapting: title/h1/lede → "Price floor" / "Impose a legal minimum price above equilibrium and watch the surplus — and the deadweight loss it creates — appear in real time."; the "Price ceiling" panel `<h2>` → "Price floor"; `ceiling-toggle`/`ceiling-slider`/`ceiling-val` ids → `floor-toggle`/`floor-slider`/`floor-val`; toggle label → "Impose floor<span class="sub">e.g. minimum wage</span>"; slider default `value="110"`; script src → `/src/pages/price-floor-entry.js`; `aria-label` → "Price floor diagram".

```js
// src/pages/price-floor.integration.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initPriceFloorPage } from './price-floor.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initPriceFloorPage against the real page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention', 'price-floor.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
  });

  it('wires up against the real ids without throwing, and shows the free-market baseline', () => {
    expect(() => initPriceFloorPage(document)).not.toThrow();
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
  });
});
```

- [ ] **Step 6: Run the integration test to verify it passes**

Run: `npx vitest run src/pages/price-floor.integration.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add units/microeconomics/government-intervention/price-floor.html src/pages/price-floor.js src/pages/price-floor-entry.js src/pages/price-floor.test.js src/pages/price-floor.integration.test.js
git commit -m "feat: add Price Floor diagram page"
```

---

### Task 12: Indirect Tax diagram page (specific / ad valorem toggle)

**Files:**
- Create: `units/microeconomics/government-intervention/indirect-tax.html`
- Create: `src/pages/indirect-tax.js`, `src/pages/indirect-tax-entry.js`
- Create: `src/pages/indirect-tax.test.js`, `src/pages/indirect-tax.integration.test.js`

**Interfaces:**
- Produces: `initIndirectTaxPage(doc)`. New control beyond Tasks 10–11: a mode radio/toggle between "Specific (per-unit)" and "Ad valorem (%)", each revealing its own slider (specific: dollar amount; ad valorem: percentage rate), mirroring the `.sub-slider` show/hide pattern from the original prototype.

- [ ] **Step 1: Write the failing unit test**

```js
// src/pages/indirect-tax.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initIndirectTaxPage } from './indirect-tax.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="mini-header"></div>
    <svg id="chart" class="market-chart"></svg>
    <span id="status-pill"></span>
    <input id="demand-slider" type="range" min="70" max="170" step="1" value="140">
    <span id="demand-val"></span>
    <input id="supply-slider" type="range" min="-10" max="110" step="1" value="20">
    <span id="supply-val"></span>
    <input type="radio" name="tax-mode" id="tax-mode-specific" value="specific" checked>
    <input type="radio" name="tax-mode" id="tax-mode-advalorem" value="advalorem">
    <input id="specific-slider" type="range" min="0" max="60" step="1" value="20">
    <span id="specific-val"></span>
    <input id="advalorem-slider" type="range" min="0" max="100" step="1" value="50">
    <span id="advalorem-val"></span>
    <button id="reset-btn" type="button"></button>
    <span id="stat-price-consumer"></span>
    <span id="stat-price-producer"></span>
    <span id="stat-qty"></span>
    <span id="stat-revenue"></span>
    <span id="stat-dwl"></span>
    <div id="market-note"></div>
  `;
}

describe('initIndirectTaxPage', () => {
  beforeEach(() => {
    buildDom();
    initIndirectTaxPage(document);
  });

  it('shows the specific-tax outcome by default', () => {
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$90.00');
    expect(document.querySelector('#stat-price-producer').textContent).toBe('$70.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('50.0');
    expect(document.querySelector('#stat-revenue').textContent).toBe('$1,000');
  });

  it('switches to the ad valorem outcome when that mode is selected', () => {
    document.querySelector('#tax-mode-advalorem').checked = true;
    document.querySelector('#tax-mode-advalorem').dispatchEvent(new Event('change'));
    expect(document.querySelector('#stat-price-producer').textContent).toBe('$64.00');
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$96.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('44.0');
    expect(document.querySelector('#stat-revenue').textContent).toBe('$1,408');
  });

  it('draws two wedge reference lines on the chart', () => {
    expect(document.querySelectorAll('#chart line.wedge-line')).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/indirect-tax.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `indirect-tax.js`**

```js
// src/pages/indirect-tax.js
import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty } from '../lib/format.js';

const DEFAULTS = { demand: 140, supply: 20, mode: 'specific', specificAmount: 20, advaloremRate: 50 };

export function initIndirectTaxPage(doc) {
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Indirect tax' });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const modeSpecific = doc.querySelector('#tax-mode-specific');
  const modeAdvalorem = doc.querySelector('#tax-mode-advalorem');
  const specificSlider = doc.querySelector('#specific-slider');
  const advaloremSlider = doc.querySelector('#advalorem-slider');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const mode = modeAdvalorem.checked ? 'advalorem' : 'specific';

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#specific-val').textContent = '$' + specificSlider.value;
    doc.querySelector('#advalorem-val').textContent = advaloremSlider.value + '%';

    const intervention = mode === 'advalorem'
      ? { type: 'tax', mode: 'advalorem', rate: (+advaloremSlider.value) / 100 }
      : { type: 'tax', mode: 'specific', amount: +specificSlider.value };

    const result = computeMarket({ demand, supply, slopeD: 1, slopeS: 1, intervention });

    renderMarketChart(chart, result);

    doc.querySelector('#status-pill').textContent = 'Tax applied';
    doc.querySelector('#stat-price-consumer').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-price-producer').textContent = result.noTrade ? '—' : fmtPrice(result.Pp);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-revenue').textContent = result.noTrade ? '$0' : fmtMoney(result.govRevenue);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    doc.querySelector('#market-note').innerHTML = result.noTrade
      ? '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.'
      : `<strong>${fmtMoney(result.DWL)} of surplus is lost.</strong> The tax wedge stops mutually beneficial trades between consumers who value the good above $${result.Pp.toFixed(0)} and sellers who would supply it below $${result.Pc.toFixed(0)}.`;
  }

  [demandSlider, supplySlider, specificSlider, advaloremSlider].forEach((input) => input.addEventListener('input', render));
  [modeSpecific, modeAdvalorem].forEach((input) => input.addEventListener('change', render));

  doc.querySelector('#reset-btn').addEventListener('click', () => {
    demandSlider.value = DEFAULTS.demand;
    supplySlider.value = DEFAULTS.supply;
    modeSpecific.checked = true;
    modeAdvalorem.checked = false;
    specificSlider.value = DEFAULTS.specificAmount;
    advaloremSlider.value = DEFAULTS.advaloremRate;
    render();
  });

  render();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/indirect-tax.test.js`
Expected: PASS

- [ ] **Step 5: Create entry script, HTML page, and integration test**

```js
// src/pages/indirect-tax-entry.js
import { initIndirectTaxPage } from './indirect-tax.js';
initIndirectTaxPage(document);
```

```html
<!-- units/microeconomics/government-intervention/indirect-tax.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Indirect Tax — Microeconomics — IB Economics Graphs</title>
  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/pages.css">
</head>
<body>
  <main class="page">
    <div id="mini-header"></div>
    <header class="top">
      <span class="eyebrow">Interactive · Microeconomics <span class="level-pill">SL</span></span>
      <h1>Indirect tax</h1>
      <p class="lede">Compare a specific (per-unit) tax with an ad valorem (percentage) tax — see how each opens a wedge between what consumers pay and what producers receive.</p>
    </header>
    <div class="layout">
      <section class="card chart-card">
        <div class="chart-head">
          <h2 class="chart-title">Price &amp; quantity</h2>
          <span class="status-pill" id="status-pill">Tax applied</span>
        </div>
        <svg id="chart" class="market-chart" viewBox="0 0 780 520" role="img" aria-label="Indirect tax diagram"></svg>
        <div class="legend">
          <span class="item"><span class="line" style="background:var(--demand)"></span>Demand</span>
          <span class="item"><span class="line" style="background:var(--supply)"></span>Supply</span>
          <span class="item"><span class="swatch" style="background:var(--supply-fill); border:1px solid var(--supply)"></span>Tax revenue</span>
          <span class="item"><span class="swatch" style="background:var(--dwl-fill); border:1px solid var(--dwl-line)"></span>Deadweight loss</span>
        </div>
      </section>
      <aside class="sidebar">
        <section class="card panel">
          <h2>Shift the curves</h2>
          <div class="slider-row">
            <div class="slider-label"><span>Demand</span><span class="val" id="demand-val">140</span></div>
            <input type="range" id="demand-slider" min="70" max="170" step="1" value="140">
          </div>
          <div class="slider-row">
            <div class="slider-label"><span>Supply</span><span class="val" id="supply-val">20</span></div>
            <input type="range" id="supply-slider" min="-10" max="110" step="1" value="20">
          </div>
          <button id="reset-btn" class="reset-btn" type="button">Reset to defaults</button>
        </section>
        <section class="card panel">
          <h2>Tax type</h2>
          <div class="toggle-row">
            <label class="label"><input type="radio" name="tax-mode" id="tax-mode-specific" value="specific" checked> Specific (per-unit)</label>
          </div>
          <div class="slider-row" style="margin-top:12px">
            <div class="slider-label"><span>Tax amount</span><span class="val" id="specific-val">$20</span></div>
            <input type="range" id="specific-slider" min="0" max="60" step="1" value="20">
          </div>
          <div class="toggle-row" style="margin-top:16px">
            <label class="label"><input type="radio" name="tax-mode" id="tax-mode-advalorem" value="advalorem"> Ad valorem (%)</label>
          </div>
          <div class="slider-row" style="margin-top:12px">
            <div class="slider-label"><span>Tax rate</span><span class="val" id="advalorem-val">50%</span></div>
            <input type="range" id="advalorem-slider" min="0" max="100" step="1" value="50">
          </div>
        </section>
        <section class="card panel">
          <h2>Market outcome</h2>
          <div class="stats-grid">
            <div class="stat"><div class="k">Price consumers pay</div><div class="v" id="stat-price-consumer">$90.00</div></div>
            <div class="stat"><div class="k">Price producers receive</div><div class="v" id="stat-price-producer">$70.00</div></div>
            <div class="stat"><div class="k">Quantity traded</div><div class="v" id="stat-qty">50.0</div></div>
            <div class="stat gov"><div class="k">Tax revenue</div><div class="v" id="stat-revenue">$1,000</div></div>
            <div class="stat dwl wide"><div class="k">Deadweight loss</div><div class="v" id="stat-dwl">$500</div></div>
          </div>
          <div class="note" id="market-note"></div>
        </section>
      </aside>
    </div>
  </main>
  <script type="module" src="/src/pages/indirect-tax-entry.js"></script>
</body>
</html>
```

```js
// src/pages/indirect-tax.integration.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initIndirectTaxPage } from './indirect-tax.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initIndirectTaxPage against the real page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention', 'indirect-tax.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
  });

  it('wires up against the real ids without throwing, and shows the default specific-tax outcome', () => {
    expect(() => initIndirectTaxPage(document)).not.toThrow();
    expect(document.querySelector('#stat-revenue').textContent).toBe('$1,000');
  });
});
```

- [ ] **Step 6: Run the integration test to verify it passes**

Run: `npx vitest run src/pages/indirect-tax.integration.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add units/microeconomics/government-intervention/indirect-tax.html src/pages/indirect-tax.js src/pages/indirect-tax-entry.js src/pages/indirect-tax.test.js src/pages/indirect-tax.integration.test.js
git commit -m "feat: add Indirect Tax diagram page with specific/ad-valorem toggle"
```

---

### Task 13: Subsidy diagram page

**Files:**
- Create: `units/microeconomics/government-intervention/subsidy.html`
- Create: `src/pages/subsidy.js`, `src/pages/subsidy-entry.js`
- Create: `src/pages/subsidy.test.js`, `src/pages/subsidy.integration.test.js`

**Interfaces:** same shape as Tasks 10–11, single amount slider, no mode toggle. Produces `initSubsidyPage(doc)`.

- [ ] **Step 1: Write the failing unit test**

```js
// src/pages/subsidy.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { initSubsidyPage } from './subsidy.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="mini-header"></div>
    <svg id="chart" class="market-chart"></svg>
    <span id="status-pill"></span>
    <input id="demand-slider" type="range" min="70" max="170" step="1" value="140">
    <span id="demand-val"></span>
    <input id="supply-slider" type="range" min="-10" max="110" step="1" value="20">
    <span id="supply-val"></span>
    <input id="subsidy-slider" type="range" min="0" max="60" step="1" value="20">
    <span id="subsidy-val"></span>
    <button id="reset-btn" type="button"></button>
    <span id="stat-price-consumer"></span>
    <span id="stat-price-producer"></span>
    <span id="stat-qty"></span>
    <span id="stat-cost"></span>
    <span id="stat-dwl"></span>
    <div id="market-note"></div>
  `;
}

describe('initSubsidyPage', () => {
  beforeEach(() => {
    buildDom();
    initSubsidyPage(document);
  });

  it('shows the default subsidy outcome', () => {
    expect(document.querySelector('#stat-price-consumer').textContent).toBe('$70.00');
    expect(document.querySelector('#stat-price-producer').textContent).toBe('$90.00');
    expect(document.querySelector('#stat-qty').textContent).toBe('70.0');
    expect(document.querySelector('#stat-cost').textContent).toBe('$1,400');
  });

  it('updates the outcome when the subsidy amount slider changes', () => {
    document.querySelector('#subsidy-slider').value = '0';
    document.querySelector('#subsidy-slider').dispatchEvent(new Event('input'));
    expect(document.querySelector('#stat-qty').textContent).toBe('60.0');
    expect(document.querySelector('#stat-cost').textContent).toBe('$0');
  });

  it('draws a wedge fill rectangle for the government cost', () => {
    expect(document.querySelector('#chart polygon.wedge-fill')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/subsidy.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `subsidy.js`**

```js
// src/pages/subsidy.js
import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtMoney, fmtPrice, fmtQty } from '../lib/format.js';

const DEFAULTS = { demand: 140, supply: 20, subsidyAmount: 20 };

export function initSubsidyPage(doc) {
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Subsidy' });

  const chart = doc.querySelector('#chart');
  const demandSlider = doc.querySelector('#demand-slider');
  const supplySlider = doc.querySelector('#supply-slider');
  const subsidySlider = doc.querySelector('#subsidy-slider');

  function render() {
    const demand = +demandSlider.value;
    const supply = +supplySlider.value;
    const amount = +subsidySlider.value;

    doc.querySelector('#demand-val').textContent = demand;
    doc.querySelector('#supply-val').textContent = supply;
    doc.querySelector('#subsidy-val').textContent = '$' + amount;

    const intervention = amount > 0 ? { type: 'subsidy', amount } : { type: 'none' };
    const result = computeMarket({ demand, supply, slopeD: 1, slopeS: 1, intervention });

    renderMarketChart(chart, result);

    doc.querySelector('#status-pill').textContent = amount > 0 ? 'Subsidy applied' : 'Free market';
    doc.querySelector('#stat-price-consumer').textContent = result.noTrade ? '—' : fmtPrice(result.Pc);
    doc.querySelector('#stat-price-producer').textContent = result.noTrade ? '—' : fmtPrice(result.Pp);
    doc.querySelector('#stat-qty').textContent = result.noTrade ? '0.0' : fmtQty(result.Q);
    doc.querySelector('#stat-cost').textContent = result.noTrade ? '$0' : fmtMoney(result.govCost);
    doc.querySelector('#stat-dwl').textContent = result.noTrade ? '$0' : fmtMoney(result.DWL);

    doc.querySelector('#market-note').innerHTML = result.noTrade
      ? '<strong>No trade occurs.</strong> Shift the sliders so demand sits above supply.'
      : amount > 0
        ? `<strong>${fmtMoney(result.DWL)} of welfare is lost.</strong> The subsidy pushes output past the efficient quantity — the last few units cost more to produce than buyers value them at.`
        : 'Equilibrium price and quantity — every mutually beneficial trade happens.';
  }

  [demandSlider, supplySlider, subsidySlider].forEach((input) => input.addEventListener('input', render));

  doc.querySelector('#reset-btn').addEventListener('click', () => {
    demandSlider.value = DEFAULTS.demand;
    supplySlider.value = DEFAULTS.supply;
    subsidySlider.value = DEFAULTS.subsidyAmount;
    render();
  });

  render();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/subsidy.test.js`
Expected: PASS

- [ ] **Step 5: Create entry script, HTML page, and integration test**

```js
// src/pages/subsidy-entry.js
import { initSubsidyPage } from './subsidy.js';
initSubsidyPage(document);
```

```html
<!-- units/microeconomics/government-intervention/subsidy.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Subsidy — Microeconomics — IB Economics Graphs</title>
  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/pages.css">
</head>
<body>
  <main class="page">
    <div id="mini-header"></div>
    <header class="top">
      <span class="eyebrow">Interactive · Microeconomics <span class="level-pill">SL</span></span>
      <h1>Subsidy</h1>
      <p class="lede">Pay producers extra per unit and watch output rise past the efficient quantity — and the welfare loss that overproduction creates.</p>
    </header>
    <div class="layout">
      <section class="card chart-card">
        <div class="chart-head">
          <h2 class="chart-title">Price &amp; quantity</h2>
          <span class="status-pill" id="status-pill">Free market</span>
        </div>
        <svg id="chart" class="market-chart" viewBox="0 0 780 520" role="img" aria-label="Subsidy diagram"></svg>
        <div class="legend">
          <span class="item"><span class="line" style="background:var(--demand)"></span>Demand</span>
          <span class="item"><span class="line" style="background:var(--supply)"></span>Supply</span>
          <span class="item"><span class="swatch" style="background:var(--supply-fill); border:1px solid var(--supply)"></span>Government cost</span>
          <span class="item"><span class="swatch" style="background:var(--dwl-fill); border:1px solid var(--dwl-line)"></span>Deadweight loss</span>
        </div>
      </section>
      <aside class="sidebar">
        <section class="card panel">
          <h2>Shift the curves</h2>
          <div class="slider-row">
            <div class="slider-label"><span>Demand</span><span class="val" id="demand-val">140</span></div>
            <input type="range" id="demand-slider" min="70" max="170" step="1" value="140">
          </div>
          <div class="slider-row">
            <div class="slider-label"><span>Supply</span><span class="val" id="supply-val">20</span></div>
            <input type="range" id="supply-slider" min="-10" max="110" step="1" value="20">
          </div>
          <button id="reset-btn" class="reset-btn" type="button">Reset to defaults</button>
        </section>
        <section class="card panel">
          <h2>Subsidy</h2>
          <div class="slider-row">
            <div class="slider-label"><span>Subsidy per unit</span><span class="val" id="subsidy-val">$20</span></div>
            <input type="range" id="subsidy-slider" min="0" max="60" step="1" value="20">
          </div>
        </section>
        <section class="card panel">
          <h2>Market outcome</h2>
          <div class="stats-grid">
            <div class="stat"><div class="k">Price consumers pay</div><div class="v" id="stat-price-consumer">$70.00</div></div>
            <div class="stat"><div class="k">Price producers receive</div><div class="v" id="stat-price-producer">$90.00</div></div>
            <div class="stat"><div class="k">Quantity traded</div><div class="v" id="stat-qty">70.0</div></div>
            <div class="stat gov"><div class="k">Government cost</div><div class="v" id="stat-cost">$1,400</div></div>
            <div class="stat dwl wide"><div class="k">Deadweight loss</div><div class="v" id="stat-dwl">$100</div></div>
          </div>
          <div class="note" id="market-note"></div>
        </section>
      </aside>
    </div>
  </main>
  <script type="module" src="/src/pages/subsidy-entry.js"></script>
</body>
</html>
```

```js
// src/pages/subsidy.integration.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSubsidyPage } from './subsidy.js';

function bodyOf(html) {
  return html.match(/<body>([\s\S]*)<\/body>/)[1];
}

describe('initSubsidyPage against the real page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'government-intervention', 'subsidy.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
  });

  it('wires up against the real ids without throwing, and shows the default subsidy outcome', () => {
    expect(() => initSubsidyPage(document)).not.toThrow();
    expect(document.querySelector('#stat-cost').textContent).toBe('$1,400');
  });
});
```

- [ ] **Step 6: Run the integration test to verify it passes**

Run: `npx vitest run src/pages/subsidy.integration.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add units/microeconomics/government-intervention/subsidy.html src/pages/subsidy.js src/pages/subsidy-entry.js src/pages/subsidy.test.js src/pages/subsidy.integration.test.js
git commit -m "feat: add Subsidy diagram page"
```

---

### Task 14: Wire the build, retire the prototype, final integration pass

**Files:**
- Modify: `vite.config.js`
- Delete: `equilibrium-lab.html`

**Interfaces:** none — this task wires existing pieces into the production build and cleans up the retired prototype.

- [ ] **Step 1: Register every new page in `vite.config.js`**

```js
// vite.config.js
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
```

- [ ] **Step 2: Verify the production build includes every new page**

Run: `npx vite build`
Expected: build succeeds; `dist/units/microeconomics.html`, `dist/units/microeconomics/government-intervention.html`, and all four `dist/units/microeconomics/government-intervention/*.html` files exist.

Confirm with:
```bash
ls dist/units/microeconomics.html dist/units/microeconomics/government-intervention.html dist/units/microeconomics/government-intervention/price-ceiling.html dist/units/microeconomics/government-intervention/price-floor.html dist/units/microeconomics/government-intervention/indirect-tax.html dist/units/microeconomics/government-intervention/subsidy.html
```
Expected: all six paths print with no "No such file" errors.

- [ ] **Step 3: Retire the prototype**

```bash
git rm equilibrium-lab.html
```

(`equilibrium-lab.html` was never listed in `rollupOptions.input`, so this does not change `dist/` output — it only removes the now-superseded source file, per the spec's "retire outright, no redirect" decision.)

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — every test file from Tasks 1–13, plus the pre-existing `home`/`wip`/`chrome`/`search` suites, all green.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js
git commit -m "feat: register Government Intervention pages in the build, retire equilibrium-lab.html"
```

---

## Self-Review

**Spec coverage:**
- Unit page structure (nested family pages) → Task 8.
- Three-tier WIP fallback → Tasks 5, 6, 8, 9 (every unbuilt family/diagram links to the WIP stub).
- Per-unit accent color → Task 7.
- Diagram inventory / SL/HL tagging → Task 5 (full data model), Tasks 10–13 (SL pill on all four built pages).
- Build sequence (Government Intervention first) → this entire plan is that slice; ceiling/floor ported first (Tasks 10–11), tax/subsidy (this week's actual class topic) built alongside (Tasks 12–13).
- Toggle-vs-separate-page rule → applied: ceiling/floor/subsidy each get their own page (different diagram shapes); specific/ad-valorem tax share one page with a mode toggle (Task 12).
- Page template reuse → Task 1 (shared CSS) + Tasks 2–4 (shared engine/chart), consumed identically by Tasks 10–13.
- Definition of done → every diagram page has live-updating regions in distinct colors (engine+chart), an SL pill, a family-page link, and is reachable from the unit page and homepage (Tasks 6–9).
- `equilibrium-lab.html` retirement → Task 14.

**Placeholder scan:** none — every step has runnable code, and math constants (test expectations) were hand-derived from the equations in Task 2, not left as TBD.

**Type consistency:** `computeMarket`'s result shape (`Q`, `Pc`, `Pp`, `mode`, `gap`, `CS`, `PS`, `DWL`, `govRevenue`, `govCost`, `csPoly`, `psPoly`, `dwlPoly`, `wedgePoly`) is defined once in Task 2 and consumed identically (same property names) by `marketChart.js` (Task 4) and all four page modules (Tasks 10–13) — no renamed fields anywhere. `unitHref`/`familyHref`/`diagramHref` (Task 5) are consumed with matching signatures in Tasks 6, 8, 9.

**Review Focus coverage:** all five items (non-binding intervention, noTrade + active intervention, 0% ad valorem, money/quantity formatting mismatch, DOM id drift between `.html` and `.js`) each have an explicit test in Task 2, 2, 2, Tasks 10–13, and every page's own `*.integration.test.js`, respectively.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-24-government-intervention.md`. Please review the plan. Which execution approach would you prefer?

- **Subagent-driven** — A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** — I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

For this plan I recommend **subagent-driven**, because Tasks 2–4 (the engine and chart renderer) are load-bearing for every one of Tasks 10–13 — a subtle math or rendering mistake there would silently propagate into all four diagram pages, and a per-task reviewer catches that before it compounds, at the cost of a fresh context per task. Does the plan capture what you want, and which approach should we use?

# Elasticity family: scaffolding + "Slope & elasticity" page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Elasticity family page and its first diagram, "Slope & elasticity at equilibrium" (SL), including the "shock" interaction with a ghost of the pre-shock curves.

**Architecture:** Reuse the free-market engine (`computeMarket`), slider model (`pageControls.js`) and renderer (`marketChart.js`) unchanged except for one new render option, `ghost`, that draws the pre-shock curves/equilibrium and relabels the axis symbols P₁/P₂, Q₁/Q₂. The page is a thin controller like `price-control.js`. The family page copies the Government Intervention family-page pattern. Flipping the Elasticity family to `built` automatically retargets every existing "Why? →" link (via `elasticityInfoHref()`) to the new family page.

**Tech Stack:** Vanilla JS modules, Vite multi-page build, Vitest + jsdom. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-05-elasticity-family-design.md` (more recent than the Elasticity notes in `2026-09-24-ib-econ-graph-site-design.md`). This plan covers only the first page in the spec's build order (`slope-and-elasticity`) plus family scaffolding. `straight-line-elasticity` (HL, needs `elasticityEngine.js` + `elasticityChart.js`) and `ped-total-revenue` (SL) each get their own later plan; they are intentionally out of scope here so each plan ships working software on its own.

**Deliberate refinement of the spec:** the spec describes a "shock control shifting supply or demand". This plan implements it as the existing signed demand/supply shift sliders (right = more), relabelled as the "Shock the market" panel, with the ghost = the same slopes at zero shift. This reuses `readCurveParams`/`guardSliders` with no new control model. There is no separate "Shift the curves" panel on this page.

**Precondition (not a task):** the working tree currently has uncommitted edits to `src/lib/marketChart.js`, `marketChart.test.js`, `marketEngine.js`, `regionExplainers.js`, `src/pages/{indirect-tax,price-control,price-floor,subsidy}.js`, `subsidy.test.js`, `src/styles/pages.css`, and `subsidy.html`. Task 3 edits `marketChart.js` and Task 4 edits `pages.css`. Commit (or otherwise settle) those first so this work doesn't tangle with them. Run `npm run test` once before starting and note any pre-existing failures.

## Global Constraints

- Plain JS ES modules, no new runtime dependencies (`package.json` has none).
- Tests colocated as `*.test.js`, Vitest + jsdom; run with `npm run test`.
- Every real page is a `.html` file registered under `build.rollupOptions.input` in `vite.config.js`.
- Unbuilt tiles route to `units/wip.html`; never a dead link.
- Header nav is a single `#mini-header` built with `getFamilyNav(slug, { familySlug })` → `renderMiniHeader(...)`. No second nav element.
- Layout: `.main-col` (chart card + "Market outcome" panel) left, `.sidebar` (controls only, "Real world examples" last) right.
- No `.slider-hint` text under elasticity sliders. The `.panel-disclaimer` ("Simplified: … Why? →") is required on every page with elasticity sliders.
- Elasticity readouts are true point elasticity (`pointElasticities()`), never derived from slope.
- No narration of the untouched baseline in `#market-note` (leave it empty).
- Chart text is real-pixel sized; new chart labels use existing `.axis-symbol`/`.curve-label` classes or their own class, never `.tick-label`.
- Unit accent: reuse `--unit-microeconomics` / `--unit-microeconomics-fill`; no new ad hoc colours.
- SL/HL `.level-pill` visible on the diagram page and its tile.
- Real-world examples: ≥3 links, found by actual web search (never constructed), ≥1 non-Western subject, `target="_blank" rel="noopener noreferrer"`.
- Commit messages end with:
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01BzdVTfzTbAw5k3vFi8MeGa`

## Review Focus

Failure modes the spec implies but no obvious task covers (each is pinned by a test in the named task):

1. **Zero shock:** ghost equals the current market. The ghost must not double-draw P₂/Q₂ labels or produce `−0.0%`; readouts must read `0.0%`. (Tasks 2, 3, 4)
2. **Shock large enough that demand sits below supply (no trade):** reachable with both shifts at −50 and flat-ish slopes. The page must show "—" / "$0", the no-trade note, and draw no ghost. (Tasks 3, 4)
3. **Shock pushes the new equilibrium off-chart:** the slider must stop at the chart edge (`guardSliders`), never render an off-curve equilibrium. (Task 4)
4. **Resize while a shock is active:** the ghost must survive the `ResizeObserver` redraw. The redraw replays `svg._lastOptions`, so `ghost` must be passed through `options`, not module state. (Task 3)
5. **Existing "Why? →" links:** once the family is built they must point at the real family page, not the WIP stub, on all four Government Intervention pages. (Task 1)

---

### Task 1: Taxonomy + Elasticity family page

**Files:**
- Modify: `src/lib/units.js` (Elasticity family block, lines ~22-31)
- Modify: `src/lib/units.test.js`
- Create: `units/microeconomics/elasticity.html`
- Create: `src/pages/elasticity.js`, `src/pages/elasticity-entry.js`, `src/pages/elasticity.test.js`
- Modify: `src/styles/pages.css` (add `theme-elasticity` accent next to the existing `theme-government-intervention` rule at ~line 232)
- Modify: `vite.config.js`
- Modify: `src/pages/price-ceiling.integration.test.js`, `price-floor.integration.test.js`, `indirect-tax.integration.test.js`, `subsidy.integration.test.js` (only if it has the same assertion; grep first)

**Interfaces:**
- Consumes: `getUnits`, `unitHref`, `diagramHref` (`units.js`), `renderMiniHeader`/`renderHero` (`chrome.js`), `renderBento` (`bento.js`), `FEEDBACK_FORM_URL`.
- Produces: `initElasticityPage(doc)`; Elasticity family `status: 'built'` with diagrams `slope-and-elasticity` (SL, `coming-soon` until Task 4), `straight-line-elasticity` (HL, coming-soon), `ped-total-revenue` (SL, coming-soon), `yed-xed` (SL, coming-soon).

- [ ] **Step 1: Write the failing tests**

In `src/lib/units.test.js`, replace the test `'marks government-intervention as built and every other family as coming-soon'` with:

```js
  it('marks government-intervention and elasticity as built and the other families as coming-soon', () => {
    const micro = getUnits().find((u) => u.slug === 'microeconomics');
    const byStatus = Object.fromEntries(micro.families.map((f) => [f.slug, f.status]));
    expect(byStatus['government-intervention']).toBe('built');
    expect(byStatus['elasticity']).toBe('built');
    expect(byStatus['demand-and-supply']).toBe('coming-soon');
    expect(byStatus['theory-of-the-firm']).toBe('coming-soon');
  });

  it('lists the four elasticity diagrams with the straight-line explainer marked HL', () => {
    const micro = getUnits().find((u) => u.slug === 'microeconomics');
    const el = micro.families.find((f) => f.slug === 'elasticity');
    expect(el.diagrams.map((d) => [d.slug, d.level])).toEqual([
      ['slope-and-elasticity', 'SL'],
      ['straight-line-elasticity', 'HL'],
      ['ped-total-revenue', 'SL'],
      ['yed-xed', 'SL'],
    ]);
  });
```

Create `src/pages/elasticity.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { initElasticityPage } from './elasticity.js';

describe('initElasticityPage', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="mini-header"></div>
      <div id="hero"></div>
      <div id="diagram-bento"></div>
      <iframe id="feedback-form"></iframe>
    `;
    initElasticityPage(document);
  });

  it('renders one tile per diagram in the family', () => {
    expect(document.querySelectorAll('#diagram-bento a.bento__tile')).toHaveLength(4);
  });

  it('routes the unbuilt diagrams to the WIP stub, tagged with their slug', () => {
    const link = document.querySelector('a[href="/units/wip.html?unit=straight-line-elasticity"]');
    expect(link).not.toBeNull();
    expect(link.querySelector('.bento__badge')).not.toBeNull();
  });

  it('shows an HL pill on the straight-line tile and SL on the others', () => {
    const pills = [...document.querySelectorAll('#diagram-bento a.bento__tile')]
      .map((a) => [a.querySelector('h3').textContent, a.querySelector('.level-pill').textContent]);
    expect(pills).toContainEqual(['Elasticity along a straight line', 'HL']);
    expect(pills).toContainEqual(['PED & total revenue', 'SL']);
  });

  it('links back to the Microeconomics unit page from the mini-header', () => {
    expect(document.querySelector('#mini-header a.mini-header__back').getAttribute('href')).toBe('/units/microeconomics.html');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/units.test.js src/pages/elasticity.test.js`
Expected: FAIL (`elasticity` status is `coming-soon`; `./elasticity.js` does not exist).

- [ ] **Step 3: Implement**

In `src/lib/units.js` replace the whole Elasticity family object with:

```js
      {
        slug: 'elasticity',
        name: 'Elasticity',
        status: 'built',
        diagrams: [
          { slug: 'slope-and-elasticity', name: 'Slope & elasticity at equilibrium', level: 'SL', status: 'coming-soon', tags: ['ped', 'pes', 'elastic', 'inelastic', 'slope', 'price shock', 'supply shock', 'demand shock'] },
          { slug: 'straight-line-elasticity', name: 'Elasticity along a straight line', level: 'HL', status: 'coming-soon', tags: ['ped', 'pes', 'straight line', 'linear demand', 'unit elastic', 'midpoint'] },
          { slug: 'ped-total-revenue', name: 'PED & total revenue', level: 'SL', status: 'coming-soon', tags: ['ped', 'total revenue', 'elastic', 'inelastic', 'price change'] },
          { slug: 'yed-xed', name: 'Income & cross elasticity', level: 'SL', status: 'coming-soon', tags: ['yed', 'xed', 'engel curve'] },
        ],
      },
```

Create `src/pages/elasticity.js`:

```js
import { renderMiniHeader, renderHero } from '../components/chrome.js';
import { renderBento } from '../components/bento.js';
import { getUnits, unitHref, diagramHref } from '../lib/units.js';
import { FEEDBACK_FORM_URL } from '../lib/feedback.js';

export function initElasticityPage(doc) {
  const unit = getUnits().find((u) => u.slug === 'microeconomics');
  const family = unit.families.find((f) => f.slug === 'elasticity');

  renderMiniHeader(doc.querySelector('#mini-header'), {
    title: family.name,
    backHref: unitHref(unit),
    backLabel: unit.name,
  });
  renderHero(doc.querySelector('#hero'), {
    eyebrow: 'MICROECONOMICS · ELASTICITY',
    title: family.name,
    lede: 'See how strongly buyers and sellers respond to price — and why that decides whether a shock hits the price or the quantity.',
  });

  const diagrams = family.diagrams.map((diagram) => ({
    slug: diagram.slug,
    name: diagram.name,
    status: diagram.status,
    level: diagram.level,
    tier: 'medium',
    href: diagramHref(unit, family, diagram),
  }));
  renderBento(doc.querySelector('#diagram-bento'), diagrams, { className: 'bento--diagrams' });

  doc.querySelector('#feedback-form').src = FEEDBACK_FORM_URL;
}
```

Create `src/pages/elasticity-entry.js`:

```js
import { initElasticityPage } from './elasticity.js';
initElasticityPage(document);
```

Create `units/microeconomics/elasticity.html` (copy of `government-intervention.html` with these changes):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Elasticity — Microeconomics — IB Economics Graphs</title>
  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/pages.css">
</head>
<body class="theme-elasticity">
  <main class="page">
    <div id="mini-header"></div>
    <div id="hero"></div>
    <div id="diagram-bento"></div>
    <div class="feedback-section">
      <h2>Something missing?</h2>
      <p>Tell us what you'd like to see next in Elasticity — it goes straight to the person building this.</p>
      <iframe id="feedback-form" title="Feedback form" loading="lazy"></iframe>
    </div>
  </main>
  <script type="module" src="/src/pages/elasticity-entry.js"></script>
</body>
</html>
```

In `src/styles/pages.css`, directly after the `body.theme-government-intervention { … }` rule, add:

```css
/* Elasticity family accent: the Microeconomics unit blue, per the per-unit identity rule. */
body.theme-elasticity {
  --accent: var(--unit-microeconomics);
  --accent-fill: var(--unit-microeconomics-fill);
}
```

In `vite.config.js` add inside `input` after `governmentIntervention`:

```js
        elasticity: 'units/microeconomics/elasticity.html',
```

- [ ] **Step 4: Run the new tests**

Run: `npx vitest run src/lib/units.test.js src/pages/elasticity.test.js`
Expected: PASS.

- [ ] **Step 5: Fix the now-stale "Why?" link assertions**

Run: `grep -rn "unit=elasticity" src`
Expected hits: the four `*.integration.test.js` assertions `toMatch(/wip\.html\?unit=elasticity$/)`. In each, change the expectation to:

```js
    expect(document.querySelector('#elasticity-more').getAttribute('href')).toBe('/units/microeconomics/elasticity.html');
```
and rename the test title from "linked to the Elasticity stub" to "linked to the Elasticity family page".

- [ ] **Step 6: Run the whole suite**

Run: `npm run test`
Expected: PASS (matches the pre-existing baseline plus the new tests). If `microeconomics.test.js` or search tests assert on the old elasticity diagram slugs/WIP status, update them to the new slugs; do not loosen them.

- [ ] **Step 7: Commit**

```bash
git add src/lib/units.js src/lib/units.test.js src/pages/elasticity.js src/pages/elasticity-entry.js src/pages/elasticity.test.js units/microeconomics/elasticity.html src/styles/pages.css vite.config.js src/pages/*.integration.test.js
git commit -m "feat(elasticity): add Elasticity family page and four-diagram taxonomy

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BzdVTfzTbAw5k3vFi8MeGa"
```

---

### Task 2: Percent-change formatting helpers

**Files:**
- Modify: `src/lib/format.js`
- Modify: `src/lib/format.test.js`

**Interfaces:**
- Produces: `pctChange(from: number, to: number): number` (percentage points, e.g. `25` for 80→100); `fmtPct(v: number): string` (`'+12.5%'`, `'−5.0%'` with U+2212, `'0.0%'`).

- [ ] **Step 1: Write the failing tests**

Add `pctChange, fmtPct` to the existing import from `./format.js` in `src/lib/format.test.js`, and append:

```js
describe('pctChange', () => {
  it('returns the signed percentage change from one value to another', () => {
    expect(pctChange(80, 100)).toBe(25);
    expect(pctChange(80, 60)).toBe(-25);
    expect(pctChange(60, 60)).toBe(0);
  });
});

describe('fmtPct', () => {
  it('shows one decimal place with an explicit sign, using a real minus', () => {
    expect(fmtPct(12.34)).toBe('+12.3%');
    expect(fmtPct(-5)).toBe('−5.0%');
  });

  it('shows zero without a sign, and never a negative zero', () => {
    expect(fmtPct(0)).toBe('0.0%');
    expect(fmtPct(-0.01)).toBe('0.0%');
    expect(fmtPct(0.04)).toBe('0.0%');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/format.test.js`
Expected: FAIL (`pctChange`/`fmtPct` are not exported).

- [ ] **Step 3: Implement** (append to `src/lib/format.js`)

```js
// Signed percentage change, e.g. pctChange(80, 100) === 25. Callers pass a nonzero `from`.
export function pctChange(from, to) {
  return ((to - from) / from) * 100;
}

// "+12.3%", "−5.0%" (U+2212, matching fmtShift), "0.0%". Anything that rounds to 0.0 is
// shown unsigned so a zero shock never reads "−0.0%".
export function fmtPct(v) {
  const shown = Math.abs(v) < 0.05 ? 0 : v;
  const text = Math.abs(shown).toFixed(1) + '%';
  if (shown > 0) return '+' + text;
  if (shown < 0) return '−' + text;
  return text;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/format.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.js src/lib/format.test.js
git commit -m "feat(format): add pctChange and fmtPct helpers

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BzdVTfzTbAw5k3vFi8MeGa"
```

---

### Task 3: `ghost` option in the market chart

**Files:**
- Modify: `src/lib/marketChart.js` (`axisSymbols` ~line 177, `drawAxisSymbols` ~line 230, `renderMarketChart` ~line 609, new `drawGhost` helper beside `drawWedgeLines`)
- Modify: `src/lib/marketChart.test.js`
- Modify: `src/styles/pages.css` (ghost classes, next to the `.market-chart .axis-symbol` rules ~line 685)

**Interfaces:**
- Consumes: `computeMarket` result objects (fields `Dmax, Smin, slopeD, slopeS, Qstar, Pstar, noTrade`).
- Produces: `renderMarketChart(svg, result, { ghost })` where `ghost` is a `computeMarket` result for the pre-shock market. When `ghost` is set and neither result is `noTrade`: draws dashed `line.ghost-curve--demand`/`line.ghost-curve--supply`, a hollow `circle.ghost-point`, two `line.ghost-guide` dashed guides to the axes, and the axis symbols become P₁/Q₁ (ghost, always full size) and P₂/Q₂ (current, shrinking to nothing at zero shock). Without `ghost`, behaviour is unchanged (Pe/Qe).

- [ ] **Step 1: Write the failing tests** (append to `src/lib/marketChart.test.js`, inside a new `describe`)

```js
describe('renderMarketChart with a ghost (pre-shock) market', () => {
  // Baseline passes through (60, 80); demand +20 moves the equilibrium to (67.5, 90).
  const slopes = { slopeD: 4 / 3, slopeS: 4 / 3 };
  const before = computeMarket({ demand: 160, supply: 0, ...slopes });
  const after = computeMarket({ demand: 180, supply: 0, ...slopes });
  const symbols = (svg) => [...svg.querySelectorAll('text.axis-symbol')].map((t) => t.textContent);
  let svg;
  beforeEach(() => { svg = makeSvg(); });

  it('draws dashed ghost curves, a hollow ghost point and two guides', () => {
    renderMarketChart(svg, after, { ghost: before });
    expect(svg.querySelector('line.ghost-curve--demand')).not.toBeNull();
    expect(svg.querySelector('line.ghost-curve--supply')).not.toBeNull();
    expect(svg.querySelector('circle.ghost-point')).not.toBeNull();
    expect(svg.querySelectorAll('line.ghost-guide')).toHaveLength(2);
  });

  it('draws no ghost without the option', () => {
    renderMarketChart(svg, after);
    expect(svg.querySelector('.ghost-curve--demand')).toBeNull();
    expect(svg.querySelector('circle.ghost-point')).toBeNull();
  });

  it('labels the axes P1/P2 and Q1/Q2 instead of Pe/Qe when a ghost is given', () => {
    renderMarketChart(svg, after, { ghost: before });
    expect(symbols(svg)).toEqual(expect.arrayContaining(['P1', 'P2', 'Q1', 'Q2']));
    expect(symbols(svg)).not.toContain('Pe');
  });

  it('keeps Pe/Qe without a ghost', () => {
    renderMarketChart(svg, after);
    expect(symbols(svg)).toEqual(expect.arrayContaining(['Pe', 'Qe']));
  });

  it('shows only P1/Q1 at zero shock, with no stray P2/Q2', () => {
    renderMarketChart(svg, before, { ghost: before });
    expect(symbols(svg)).toEqual(expect.arrayContaining(['P1', 'Q1']));
    expect(symbols(svg)).not.toContain('P2');
    expect(symbols(svg)).not.toContain('Q2');
  });

  it('draws no ghost when the shocked market has no trade', () => {
    const closed = computeMarket({ demand: 20, supply: 60, ...slopes });
    expect(closed.noTrade).toBe(true);
    renderMarketChart(svg, closed, { ghost: before });
    expect(svg.querySelector('.ghost-curve--demand')).toBeNull();
    expect(svg.querySelector('circle.ghost-point')).toBeNull();
  });

  it('replays the ghost when the chart redraws from its stored options', () => {
    renderMarketChart(svg, after, { ghost: before });
    expect(svg._lastOptions.ghost).toBe(before);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/marketChart.test.js`
Expected: the new tests FAIL (no ghost elements; symbols are Pe/Qe).

- [ ] **Step 3: Implement**

3a. In `axisSymbols`, change the signature and the first two lines:

```js
function axisSymbols(result, ghost) {
  // With a ghost (pre-shock) market the equilibrium symbols become P1/Q1 (the ghost, always
  // full size) and P2/Q2 (the current market, which fades out as it closes on the ghost);
  // otherwise it is the usual Pe/Qe.
  const y = ghost
    ? [{ base: 'P', sub: '1', v: ghost.Pstar, ref: true }, { base: 'P', sub: '2', v: result.Pstar }]
    : [{ base: 'P', sub: 'e', v: result.Pstar, ref: true }];
  const x = ghost
    ? [{ base: 'Q', sub: '1', v: ghost.Qstar, ref: true }, { base: 'Q', sub: '2', v: result.Qstar }]
    : [{ base: 'Q', sub: 'e', v: result.Qstar, ref: true }];
```
(The rest of the function, from `if (isPriceControl(result))` down, is unchanged; the `y`/`x` declarations it already had are replaced by the two above.)

3b. `drawAxisSymbols(svg, layer, result, ghost)` — add the `ghost` parameter and change its first line to `const { x, y } = axisSymbols(result, ghost);`.

3c. Add the helper just above `renderMarketChart`:

```js
// The pre-shock market, drawn under the live curves: dashed copies of both curves, a hollow
// point at its equilibrium, and faint guides from that point to the axes (labelled P1/Q1 by
// the axis symbols). Skipped when either market has no trade, since there is no equilibrium.
function drawGhost(layer, ghost) {
  const dSeg = clipDemand(ghost.Dmax, ghost.slopeD), sSeg = clipSupply(ghost.Smin, ghost.slopeS);
  const dashed = { 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-dasharray': '6,4', 'stroke-opacity': '0.55' };
  layer.appendChild(el('line', { x1: sx(dSeg[0][0]), y1: sy(dSeg[0][1]), x2: sx(dSeg[1][0]), y2: sy(dSeg[1][1]), stroke: 'var(--demand)', ...dashed }, 'ghost-curve ghost-curve--demand'));
  layer.appendChild(el('line', { x1: sx(sSeg[0][0]), y1: sy(sSeg[0][1]), x2: sx(sSeg[1][0]), y2: sy(sSeg[1][1]), stroke: 'var(--supply)', ...dashed }, 'ghost-curve ghost-curve--supply'));
  layer.appendChild(el('line', { x1: sx(ghost.Qstar), y1: sy(ghost.Pstar), x2: sx(ghost.Qstar), y2: M.top + plotH }, 'ghost-guide'));
  layer.appendChild(el('line', { x1: M.left, y1: sy(ghost.Pstar), x2: sx(ghost.Qstar), y2: sy(ghost.Pstar) }, 'ghost-guide'));
  layer.appendChild(el('circle', { cx: sx(ghost.Qstar), cy: sy(ghost.Pstar), r: 4, fill: 'var(--surface)', stroke: 'var(--ink-muted)', 'stroke-width': 1.6 }, 'ghost-point'));
}
```

3d. In `renderMarketChart`, compute the usable ghost and draw it before the live curves (immediately after the `if (!result.noTrade) { …fills… }` block closes and before `const shifted = shiftedSupplyParams(result);`):

```js
  const ghost = options.ghost && !options.ghost.noTrade && !result.noTrade ? options.ghost : null;
  if (ghost) drawGhost(layer, ghost);
```
and change the final call to `drawAxisSymbols(svg, layer, result, ghost);`.

3e. In `src/styles/pages.css`, after the `.market-chart .axis-symbol--ref` rule add:

```css
.market-chart .ghost-guide { stroke: var(--ink-muted); stroke-width: 1; stroke-dasharray: 3 3; stroke-opacity: 0.6; }
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/marketChart.test.js`
Expected: PASS, including all pre-existing chart tests. If a pre-existing symbol test fails, the no-ghost path was changed by mistake; fix `axisSymbols` so the no-ghost branch is byte-for-byte what it was.

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketChart.js src/lib/marketChart.test.js src/styles/pages.css
git commit -m "feat(chart): add ghost option drawing the pre-shock market

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BzdVTfzTbAw5k3vFi8MeGa"
```

---

### Task 4: "Slope & elasticity at equilibrium" page

**Files:**
- Create: `units/microeconomics/elasticity/slope-and-elasticity.html`
- Create: `src/pages/slope-and-elasticity.js`, `slope-and-elasticity-entry.js`, `slope-and-elasticity.test.js`, `slope-and-elasticity.integration.test.js`
- Modify: `src/lib/units.js` (flip `slope-and-elasticity` to `built`), `src/lib/units.test.js`
- Modify: `vite.config.js`

**Interfaces:**
- Consumes: `computeMarket`; `renderMarketChart(svg, result, { ghost })` (Task 3); `pctChange`, `fmtPct`, `fmtPrice`, `fmtQty`, `fmtMoney`, `setStatusPill` (`format.js`); `wireShiftAndSlopeInputs`, `updateShiftAndSlopeLabels`, `readCurveParams`, `marketFits`, `NO_TRADE_NOTE` (`pageControls.js`); `getFamilyNav`, `renderMiniHeader`.
- Produces: `initSlopeAndElasticityPage(doc)`. DOM ids it requires: `#mini-header #chart #status-pill #demand-slider #demand-val #supply-slider #supply-val #slope-d-slider #slope-d-val #slope-s-slider #slope-s-val #stat-price #stat-qty #stat-dp #stat-dq #stat-cs #stat-ps #market-note #feedback-form` (+ optional `#elasticity-more`).

Numbers used below (default slopes 4/3 → baseline equilibrium P = $80, Q = 60; CS = PS = $2,400): demand shock +20 → P = 90.00 (+12.5%), Q = 67.5 (+12.5%); supply shock +20 → P = 70.00 (−12.5%), Q = 67.5 (+12.5%).

- [ ] **Step 1: Write the failing tests**

`src/pages/slope-and-elasticity.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { initSlopeAndElasticityPage } from './slope-and-elasticity.js';

function buildDom() {
  document.body.innerHTML = `
    <div id="mini-header"></div>
    <svg id="chart" class="market-chart"></svg>
    <span id="status-pill"></span>
    <input id="demand-slider" type="range" min="-50" max="50" step="1" value="0">
    <span id="demand-val"></span>
    <input id="supply-slider" type="range" min="-50" max="50" step="1" value="0">
    <span id="supply-val"></span>
    <input id="slope-d-slider" type="range" min="-0.5" max="0.5" step="0.05" value="0">
    <span id="slope-d-val"></span>
    <input id="slope-s-slider" type="range" min="-0.5" max="0.5" step="0.05" value="0">
    <span id="slope-s-val"></span>
    <span id="stat-price"></span>
    <span id="stat-qty"></span>
    <span id="stat-dp"></span>
    <span id="stat-dq"></span>
    <span id="stat-cs"></span>
    <span id="stat-ps"></span>
    <div id="market-note"></div>
    <iframe id="feedback-form"></iframe>
  `;
}

function drag(id, value) {
  const input = document.querySelector(id);
  input.value = String(value);
  input.dispatchEvent(new Event('input'));
}
const text = (id) => document.querySelector(id).textContent;

describe('initSlopeAndElasticityPage', () => {
  beforeEach(() => {
    buildDom();
    initSlopeAndElasticityPage(document);
  });

  it('starts at the free-market baseline with zero change and no note', () => {
    expect(text('#stat-price')).toBe('$80.00');
    expect(text('#stat-qty')).toBe('60.0');
    expect(text('#stat-dp')).toBe('0.0%');
    expect(text('#stat-dq')).toBe('0.0%');
    expect(text('#stat-cs')).toBe('$2,400');
    expect(text('#status-pill')).toBe('Free market');
    expect(document.querySelector('#market-note').innerHTML).toBe('');
  });

  it('shows price and quantity both rising after a demand shock', () => {
    drag('#demand-slider', 20);
    expect(text('#stat-price')).toBe('$90.00');
    expect(text('#stat-qty')).toBe('67.5');
    expect(text('#stat-dp')).toBe('+12.5%');
    expect(text('#stat-dq')).toBe('+12.5%');
    expect(text('#status-pill')).toBe('After shock');
  });

  it('shows price falling and quantity rising after a supply shock', () => {
    drag('#supply-slider', 20);
    expect(text('#stat-price')).toBe('$70.00');
    expect(text('#stat-dp')).toBe('−12.5%');
    expect(text('#stat-dq')).toBe('+12.5%');
  });

  it('puts more of the supply shock into price when demand is made steeper (less elastic)', () => {
    drag('#slope-d-slider', -0.5);
    drag('#supply-slider', 20);
    const steepDp = Math.abs(parseFloat(text('#stat-dp').replace('−', '-')));
    drag('#slope-d-slider', 0.5);
    const flatDp = Math.abs(parseFloat(text('#stat-dp').replace('−', '-')));
    expect(steepDp).toBeGreaterThan(flatDp);
  });

  it('draws the ghost point from the start and the ghost curves once a shock is applied', () => {
    expect(document.querySelector('circle.ghost-point')).not.toBeNull(); // present at zero shock, sitting under the live curves
    drag('#demand-slider', 20);
    expect(document.querySelector('line.ghost-curve--demand')).not.toBeNull();
  });

  it('stops the sliders at the chart edge instead of drawing an off-chart equilibrium', () => {
    drag('#slope-d-slider', -0.5);
    drag('#slope-s-slider', -0.5);
    drag('#demand-slider', 50);
    drag('#supply-slider', 50);
    const p = parseFloat(text('#stat-price').replace('$', ''));
    const q = parseFloat(text('#stat-qty'));
    expect(p).toBeLessThanOrEqual(180);
    expect(q).toBeLessThanOrEqual(100);
  });

  it('reports no trade with dashes and the no-trade note when demand falls below supply', () => {
    drag('#slope-d-slider', 0.5);
    drag('#slope-s-slider', 0.5);
    drag('#demand-slider', -50);
    drag('#supply-slider', -50);
    expect(text('#stat-price')).toBe('—');
    expect(text('#stat-dp')).toBe('—');
    expect(text('#stat-cs')).toBe('$0');
    expect(document.querySelector('#market-note').innerHTML).toContain('No trade occurs');
    expect(document.querySelector('circle.ghost-point')).toBeNull();
  });

  it('shows true point elasticity at equilibrium, starting at unit elastic', () => {
    expect(text('#slope-d-val')).toBe('1.00 · unit elastic');
    drag('#slope-d-slider', 0.5);
    expect(text('#slope-d-val')).toBe('3.16 · elastic');
  });

  it('renders a mini-header back link to the Elasticity family and sibling links', () => {
    expect(document.querySelector('#mini-header a.mini-header__back').getAttribute('href')).toBe('/units/microeconomics/elasticity.html');
    const names = [...document.querySelectorAll('#mini-header .mini-header__siblings a')].map((a) => a.textContent);
    expect(names).not.toContain('Slope & elasticity at equilibrium');
    expect(names).toContain('PED & total revenue');
  });
});
```

Note on the "no trade" test: confirm during Step 4 that this slider combination actually yields `noTrade` (flat slopes 4/3·10^−0.5 ≈ 0.42 each; demand intercept 80+(−50)+0.42·60 ≈ 55, supply intercept 80+50−0.42·60 ≈ 105). If the guard stops a slider before that, set the sliders in the order that reaches it (drag shifts first, then slopes) and adjust only the drag order, not the assertions.

`src/pages/slope-and-elasticity.integration.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSlopeAndElasticityPage } from './slope-and-elasticity.js';

function bodyOf(html) {
  return html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
}

describe('initSlopeAndElasticityPage against the real page markup', () => {
  beforeEach(() => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(dir, '..', '..', 'units', 'microeconomics', 'elasticity', 'slope-and-elasticity.html'), 'utf8');
    document.body.innerHTML = bodyOf(html);
  });

  it('wires up against the real ids without throwing and shows the baseline', () => {
    expect(() => initSlopeAndElasticityPage(document)).not.toThrow();
    expect(document.querySelector('#stat-price').textContent).toBe('$80.00');
  });

  it('has a single mini-header nav and no separate family-nav row', () => {
    initSlopeAndElasticityPage(document);
    expect(document.querySelector('#mini-header a.mini-header__back')).not.toBeNull();
    expect(document.querySelector('#family-nav')).toBeNull();
  });

  it('shows an SL pill', () => {
    expect(document.querySelector('.level-pill').textContent).toBe('SL');
  });

  it('shows the elasticity disclaimer linked to the Elasticity family page, with no slider hints', () => {
    initSlopeAndElasticityPage(document);
    expect(document.querySelector('.panel-disclaimer').textContent).toMatch(/Simplified/);
    expect(document.querySelector('#elasticity-more').getAttribute('href')).toBe('/units/microeconomics/elasticity.html');
    expect(document.querySelector('.slider-hint')).toBeNull();
  });

  it('has no intervention toggle (there is no policy on this page)', () => {
    expect(document.querySelector('.toggle-row--primary')).toBeNull();
  });

  it('renders three real-world example links that open in a new tab safely, with at least one marked non-Western', () => {
    const links = document.querySelectorAll('.examples-list a');
    expect(links).toHaveLength(3);
    links.forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
    expect(document.querySelectorAll('.examples-list li[data-region="non-western"]').length).toBeGreaterThanOrEqual(1);
  });
});
```

Also in `src/lib/units.test.js` add:

```js
  it('lists slope-and-elasticity as the one built elasticity diagram, at SL', () => {
    const micro = getUnits().find((u) => u.slug === 'microeconomics');
    const el = micro.families.find((f) => f.slug === 'elasticity');
    const built = el.diagrams.filter((d) => d.status === 'built');
    expect(built.map((d) => d.slug)).toEqual(['slope-and-elasticity']);
    expect(built[0].level).toBe('SL');
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/pages/slope-and-elasticity.test.js src/pages/slope-and-elasticity.integration.test.js src/lib/units.test.js`
Expected: FAIL (module/html missing; diagram still `coming-soon`).

- [ ] **Step 3: Implement the controller**

`src/pages/slope-and-elasticity.js`:

```js
import { renderMiniHeader } from '../components/chrome.js';
import { computeMarket } from '../lib/marketEngine.js';
import { renderMarketChart } from '../lib/marketChart.js';
import { fmtPrice, fmtQty, fmtMoney, fmtPct, pctChange, setStatusPill } from '../lib/format.js';
import { getFamilyNav } from '../components/familyNav.js';
import { wireShiftAndSlopeInputs, updateShiftAndSlopeLabels, readCurveParams, marketFits, NO_TRADE_NOTE } from '../lib/pageControls.js';
import { FEEDBACK_FORM_URL } from '../lib/feedback.js';

// "Slope & elasticity at equilibrium" (SL). No policy here, so no intervention toggle: the
// star interaction is shocking the market. The demand/supply shift sliders are the shock;
// the "ghost" is the same curves (same slopes) at zero shift, i.e. the market before the
// shock. Changing a slope pivots a curve through the baseline equilibrium, so a student can
// make demand or supply steeper/flatter and watch whether the shock lands on price or quantity.
export function initSlopeAndElasticityPage(doc) {
  const { backHref, backLabel, siblings } = getFamilyNav('slope-and-elasticity', { familySlug: 'elasticity' });
  renderMiniHeader(doc.querySelector('#mini-header'), { title: 'Slope & elasticity', backHref, backLabel, siblings });

  const chart = doc.querySelector('#chart');
  const set = (id, text) => { doc.querySelector(id).textContent = text; };

  // The shock must keep the *shocked* market on-chart; the zero-shift baseline always passes
  // through (60, 80), so it never needs checking.
  const sliders = wireShiftAndSlopeInputs(doc, () => render(), () => marketFits(readCurveParams(sliders).market));

  function render() {
    const curve = readCurveParams(sliders);
    const { market } = curve;
    updateShiftAndSlopeLabels(doc, curve);

    const before = computeMarket({ ...market, demand: market.demand - curve.demandShift, supply: market.supply + curve.supplyShift });
    const after = computeMarket(market);
    renderMarketChart(chart, after, { ghost: before });

    const shocked = curve.demandShift !== 0 || curve.supplyShift !== 0;
    setStatusPill(doc.querySelector('#status-pill'), after.noTrade ? 'No trade' : shocked ? 'After shock' : 'Free market', shocked ? undefined : 'free');

    if (after.noTrade) {
      set('#stat-price', '—'); set('#stat-qty', '0.0');
      set('#stat-dp', '—'); set('#stat-dq', '—');
      set('#stat-cs', '$0'); set('#stat-ps', '$0');
      doc.querySelector('#market-note').innerHTML = NO_TRADE_NOTE;
      return;
    }
    set('#stat-price', fmtPrice(after.Pstar));
    set('#stat-qty', fmtQty(after.Qstar));
    set('#stat-dp', fmtPct(pctChange(before.Pstar, after.Pstar)));
    set('#stat-dq', fmtPct(pctChange(before.Qstar, after.Qstar)));
    set('#stat-cs', fmtMoney(after.CS));
    set('#stat-ps', fmtMoney(after.PS));
    doc.querySelector('#market-note').innerHTML = '';
  }

  render();
  doc.querySelector('#feedback-form').src = FEEDBACK_FORM_URL;
}
```

`src/pages/slope-and-elasticity-entry.js`:

```js
import { initSlopeAndElasticityPage } from './slope-and-elasticity.js';
initSlopeAndElasticityPage(document);
```

- [ ] **Step 4: Create the page markup**

Before writing the examples block, open each of the three URLs below with WebFetch and confirm the article matches its one-line description; if one doesn't, run a new web search and substitute a URL **returned by that search** (never construct one). Non-Western requirement: the Mongabay (Indonesia) and Daily Star (India's export ban, as felt in Bangladesh) examples satisfy it.

`units/microeconomics/elasticity/slope-and-elasticity.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slope &amp; Elasticity — Microeconomics — IB Economics Graphs</title>
  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/pages.css">
</head>
<body class="theme-elasticity">
  <main class="page">
    <div id="mini-header"></div>
    <header class="top">
      <span class="eyebrow">Interactive · Microeconomics <span class="level-pill">SL</span></span>
      <h1>Slope &amp; elasticity at equilibrium</h1>
      <p class="lede">Make demand or supply steeper or flatter, then shock the market — and watch whether the price or the quantity takes the hit.</p>
    </header>
    <div class="layout">
      <div class="main-col">
        <section class="card chart-card">
          <div class="chart-head">
            <h2 class="chart-title">Price &amp; quantity</h2>
            <span class="status-pill" id="status-pill">Free market</span>
          </div>
          <svg id="chart" class="market-chart" viewBox="0 0 780 520" role="img" aria-label="Market diagram showing a shock to demand or supply"></svg>
          <div class="legend">
            <span class="item"><span class="line" style="background:var(--demand)"></span>Demand</span>
            <span class="item"><span class="line" style="background:var(--supply)"></span>Supply</span>
            <span class="item"><span class="line" style="background:repeating-linear-gradient(90deg, var(--ink-muted) 0 6px, transparent 6px 10px)"></span>Before the shock</span>
            <span class="item"><span class="swatch" style="background:var(--demand-fill); border:1px solid var(--demand)"></span>Consumer surplus</span>
            <span class="item"><span class="swatch" style="background:var(--supply-fill); border:1px solid var(--supply)"></span>Producer surplus</span>
          </div>
        </section>
        <section class="card panel">
          <h2>Market outcome</h2>
          <div class="stats-grid">
            <div class="stat"><div class="k">Price</div><div class="v" id="stat-price">$80.00</div></div>
            <div class="stat"><div class="k">Quantity traded</div><div class="v" id="stat-qty">60.0</div></div>
            <div class="stat"><div class="k">Change in price</div><div class="v" id="stat-dp">0.0%</div></div>
            <div class="stat"><div class="k">Change in quantity</div><div class="v" id="stat-dq">0.0%</div></div>
            <div class="stat cs"><div class="k">Consumer surplus</div><div class="v" id="stat-cs">$2,400</div></div>
            <div class="stat ps"><div class="k">Producer surplus</div><div class="v" id="stat-ps">$2,400</div></div>
          </div>
          <div class="note" id="market-note"></div>
        </section>
      </div>
      <aside class="sidebar">
        <section class="card panel">
          <h2>Shock the market</h2>
          <div class="slider-row">
            <div class="slider-label"><span>Demand</span><span class="val" id="demand-val">0</span></div>
            <input type="range" id="demand-slider" min="-50" max="50" step="1" value="0">
          </div>
          <div class="slider-row">
            <div class="slider-label"><span>Supply</span><span class="val" id="supply-val">0</span></div>
            <input type="range" id="supply-slider" min="-50" max="50" step="1" value="0">
          </div>
        </section>
        <section class="card panel">
          <h2>Elasticity</h2>
          <p class="panel-disclaimer">Simplified: on a straight-line curve, elasticity changes along the curve — shown here at the equilibrium. <a id="elasticity-more" href="/units/microeconomics/elasticity.html">Why? →</a></p>
          <div class="slider-row">
            <div class="slider-label"><span>Demand elasticity</span><span class="val" id="slope-d-val">1.00 · unit elastic</span></div>
            <input type="range" id="slope-d-slider" min="-0.5" max="0.5" step="0.05" value="0">
          </div>
          <div class="slider-row">
            <div class="slider-label"><span>Supply elasticity</span><span class="val" id="slope-s-val">1.00 · unit elastic</span></div>
            <input type="range" id="slope-s-slider" min="-0.5" max="0.5" step="0.05" value="0">
          </div>
        </section>
        <section class="card panel examples-panel">
          <h2>Real world examples</h2>
          <ul class="examples-list">
            <li><a href="https://www.resources.org/common-resources/the-2008-oil-price-shock-markets-or-mayhem/" target="_blank" rel="noopener noreferrer"><span class="examples-list__title">The 2008 oil price shock — why inelastic demand and supply make prices spike</span><span class="examples-list__source">Resources for the Future</span></a></li>
            <li data-region="non-western"><a href="https://news.mongabay.com/2022/04/for-indonesians-palm-oil-is-everywhere-but-on-supermarket-shelves/" target="_blank" rel="noopener noreferrer"><span class="examples-list__title">Indonesia's cooking oil shortage — palm oil everywhere but on supermarket shelves</span><span class="examples-list__source">Mongabay</span></a></li>
            <li data-region="non-western"><a href="https://www.thedailystar.net/business/news/onion-prices-surge-supply-squeeze-after-indias-export-ban-extension-3489916" target="_blank" rel="noopener noreferrer"><span class="examples-list__title">Onion prices surge on a supply squeeze after India's export ban extension</span><span class="examples-list__source">The Daily Star (Bangladesh)</span></a></li>
          </ul>
        </section>
      </aside>
    </div>
    <div class="feedback-section">
      <h2>Something missing?</h2>
      <p>Tell us what you'd like to see next in Slope &amp; elasticity — it goes straight to the person building this.</p>
      <iframe id="feedback-form" title="Feedback form" loading="lazy"></iframe>
    </div>
  </main>
  <script type="module" src="/src/pages/slope-and-elasticity-entry.js"></script>
</body>
</html>
```

- [ ] **Step 5: Register and flip status**

In `vite.config.js` add inside `input`:

```js
        slopeAndElasticity: 'units/microeconomics/elasticity/slope-and-elasticity.html',
```
In `src/lib/units.js`, change the `slope-and-elasticity` diagram's `status: 'coming-soon'` to `status: 'built'`.

- [ ] **Step 6: Run to verify pass**

Run: `npm run test`
Expected: PASS for the whole suite. Fix, in this order, any of: (a) the no-trade test drag order (see note in Step 1); (b) `elasticity.test.js` from Task 1 — the `slope-and-elasticity` tile now links to the real page, so its WIP-route assertion must keep targeting `straight-line-elasticity` (it already does).

- [ ] **Step 7: Build and look at it in a browser**

Run: `npm run build` → expected: succeeds with the two new HTML entries emitted. Then `npm run dev` and open `http://localhost:5173/units/microeconomics/elasticity/slope-and-elasticity.html`. Check by eye, and report what you actually saw:
1. Baseline: no ghost visible, axis shows P₁/Q₁ only, "Free market" pill, empty note.
2. Drag Demand to +20: dashed ghost curves stay, new curves move, P₂/Q₂ appear, both % tiles show +12.5%.
3. Set Demand elasticity to the far left (steep) then Supply to +20: price tile moves a lot, quantity little; flip to far right: the reverse.
4. Resize the window mid-shock: the ghost remains.
5. The two columns end at the same bottom edge; examples cards fill the panel.
6. The family page `/units/microeconomics/elasticity.html` shows four tiles, three with "Coming soon" badges and the HL pill on the straight-line tile; the Why? link on a Government Intervention page now opens it.

- [ ] **Step 8: Commit**

```bash
git add units/microeconomics/elasticity src/pages/slope-and-elasticity*.js src/lib/units.js src/lib/units.test.js vite.config.js
git commit -m "feat(elasticity): add Slope & elasticity at equilibrium page

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BzdVTfzTbAw5k3vFi8MeGa"
```

---

### Task 5: Docs sync

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-09-24-ib-econ-graph-site-design.md` (Elasticity inventory line ~98)

- [ ] **Step 1:** In the main spec's "Diagram inventory" Elasticity line, replace the PED/PES/YED-XED list with a one-line pointer: `Elasticity: see 2026-10-05-elasticity-family-design.md (four pages: slope-and-elasticity SL, straight-line-elasticity HL, ped-total-revenue SL, yed-xed SL).`
- [ ] **Step 2:** In `CLAUDE.md`, under "Microeconomics build order", item 3, append: `Elasticity family design: docs/superpowers/specs/2026-10-05-elasticity-family-design.md; the Slope & elasticity page is built, the other three are WIP-stub tiles.` Also add one sentence to the elasticity-slider bullet: the "Why? →" link resolves via `elasticityInfoHref()` to the Elasticity family page.
- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-09-24-ib-econ-graph-site-design.md
git commit -m "docs: sync Elasticity family status into CLAUDE.md and main spec

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BzdVTfzTbAw5k3vFi8MeGa"
```

---

## Self-review notes

- **Spec coverage:** family page + taxonomy (Task 1); `slope-and-elasticity` with shock + ghost + ΔP/ΔQ + slider model + disclaimer + true point elasticity + no intervention toggle + examples with non-Western + feedback form + SL pill + header nav + two-column layout (Tasks 3-4); "Why? →" retargeting (Task 1 Step 5). Not covered by design, deferred to later plans: `elasticityEngine.js`, `elasticityChart.js`, `straight-line-elasticity`, `ped-total-revenue`, `yed-xed`, and retargeting the Why? link to the HL page. Homepage search indexing is automatic from `units.js` tags (verified by the existing `matchGraphs` walk over family/diagram tags).
- **Spec deviation:** noted in the header (shock = existing shift sliders; no separate radio).
- **Type consistency:** `ghost` is a `computeMarket` result everywhere; `initSlopeAndElasticityPage`, `pctChange`, `fmtPct`, DOM ids match between tests, controller and HTML.
- **Not independently verified while writing:** that `search`/`microeconomics`/home tests don't assert the old `ped`/`pes` slugs (Task 1 Step 6 handles it), and the exact no-trade slider combination (Task 4 Step 1 note).

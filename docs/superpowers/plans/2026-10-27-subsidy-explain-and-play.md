# Subsidy Explain & Play Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the subsidy page an Explain mode (an 11-step guided build-up of the diagram) and a reworked Play mode (IB perfect by default, plus an Explorer view that highlights one area at a time), reached from a Subsidy tile that splits into Explain / Play tiles.

**Architecture:** The shared engine (`marketEngine.js`) gains the subsidy polygons Ms. Patel asked for (CS/PS triangles, marginal CS/PS). The shared renderer (`marketChart.js`) is refactored so every drawn element belongs to a named *layer*; a resolver picks the layer set from `detail` / `focus` / an explicit `layers` list, which is what lets Explain build the diagram step by step and Explorer strip it down to one area. Small focused components (mode switch, view switch + focus bar, explain card, tile split) are wired together in `src/pages/subsidy.js`; URL state lives in `src/lib/pageMode.js`.

**Tech Stack:** Vanilla JS ES modules, SVG, Vite 5 multi-page build, Vitest 2 + jsdom. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-27-subsidy-explain-and-play-design.md` (read it first; this plan argues from it). Project rules: `CLAUDE.md`.

## Global Constraints

- Scope is the subsidy page plus the shared modules it needs. Price ceiling, price floor and indirect tax pages must look and behave exactly as before: all 446 existing tests stay green after every task.
- No runtime dependencies. Tests colocated (`*.test.js`), run with `npx vitest run <file>`; full suite `npm run test`.
- Animations: `tweenValue` (`src/lib/animate.js`, ~400ms) for anything that drives `computeMarket`; CSS keyframes for fade/grow. Every animation is disabled under `@media (prefers-reduced-motion: reduce)`.
- The subsidy on/off toggle keeps its rule: defaults off, animates via `wireInterventionToggle`, uses `.toggle-row--primary`.
- Other pages' detail contract is untouched: a computed-number annotation is gated `detail === 'full'`, never `!== 'ib'`.
- Shaded areas stay clickable (have a `data-region`) in every view, focus and Explain step.
- Every page works with `localStorage` unavailable. The subsidy page's view/focus is never written to or read from `localStorage`.
- Exact names from the spec: tabs **Explain** / **Play**; views **IB perfect** / **Explorer**; highlights **Consumer surplus · Producer surplus · Overlap · Government spending · Welfare loss**; final button **Try it in Play →**.
- Work on the current `development` branch; commit after every task. End commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Subsidy amount at $0** (Explain slider dragged to 0, or Explorer with the toggle mid-tween): marginal bands degenerate. Expect no NaN in any `points` attribute, no zero-size chips, and the focus chip omitted when its area is 0. Tests: Task 1 (zero amount), Task 4 (zero-area focus).
2. **Dragging a slider right after a step change:** the fade/grow classes must only apply on the step's first render; otherwise every slider tick restarts the animation and the chart flickers. Test: Task 2 (`enter` only on the render that passes it) and Task 9 (slider input re-render has no `.layer-enter`).
3. **Hand-edited or unknown URLs** (`#foo`, `?view=bogus`, `?focus=cs` without `view`, the back button changing the hash): expect Play, IB perfect, and `focus=cs` implying Explorer. Tests: Task 6.
4. **Non-default curves in Explorer** (steep supply whose line meets the axis below $0, flat demand): marginal CS + marginal PS + DWL must still equal government spending. Test: Task 1 identity across three parameter sets.
5. **Double activation of the split tile** (two clicks, or Enter then click): exactly one Explain/Play pair; Escape restores the tile and focuses it. Test: Task 11.

---

### Task 1: Engine — subsidy triangles, marginal bands, overlap area

**Files:**
- Modify: `src/lib/marketEngine.js` (`subsidyResult`, ~line 153)
- Test: `src/lib/marketEngine.test.js`

**Interfaces:**
- Produces, on a `mode: 'subsidy'` result: `csTrianglePoly`, `psTrianglePoly` (free-market CS/PS triangles: `csPolyFor(Dmax, Pd, Qstar, Pstar)`, `psPolyFor(Smin, slopeS, Qstar, Pstar)`), `marginalCsPoly` (`clipPoly(csPoly, ([, p]) => Pstar - p)`), `marginalPsPoly` (`clipPoly(psPoly, ([, p]) => p - Pstar)`), and numbers `marginalCS`, `marginalPS`, `overlapArea` (shoelace areas; 0 for an empty/degenerate poly).

- [ ] **Step 1: Write the failing tests** in a new `describe('subsidy marginal surplus', …)`:

```js
const sub = (amount, m = { demand: 140, supply: 20, slopeD: 1, slopeS: 1 }) =>
  computeMarket({ ...m, intervention: { type: 'subsidy', amount } });

it('returns the free-market CS and PS triangles', () => {
  const r = sub(20);
  expect(r.csTrianglePoly).toEqual([[0, 140], [60, 80], [60, 80], [0, 80]]);
  expect(r.psTrianglePoly.length).toBeGreaterThanOrEqual(3);
});
it('measures marginal CS and PS under the curves, not the wedge rectangles', () => {
  const r = sub(20);              // Qe 60, Pe 80, Q1 70, Pc 70, Pp 90
  expect(r.marginalCS).toBeCloseTo(650);
  expect(r.marginalPS).toBeCloseTo(650);
  expect(r.DWL).toBeCloseTo(100);
  expect(r.overlapArea).toBeGreaterThan(0);
});
it.each([
  [{ demand: 140, supply: 20, slopeD: 1, slopeS: 1 }],
  [{ demand: 160, supply: 0, slopeD: 4 / 3, slopeS: 4 / 3 }],
  [{ demand: 120, supply: -40, slopeD: 0.5, slopeS: 3 }],   // supply meets the axis below $0
])('marginal CS + marginal PS + DWL = government spending (%o)', (m) => {
  const r = sub(15, m);
  expect(r.marginalCS + r.marginalPS + r.DWL).toBeCloseTo(r.govCost, 6);
});
it('collapses cleanly at a $0 subsidy', () => {
  const r = sub(0);
  expect(r.marginalCS).toBeCloseTo(0);
  expect(r.marginalPS).toBeCloseTo(0);
  expect(r.overlapArea).toBeCloseTo(0);
  [...r.marginalCsPoly, ...r.marginalPsPoly].flat().forEach((v) => expect(Number.isFinite(v)).toBe(true));
});
```

- [ ] **Step 2: Run** `npx vitest run src/lib/marketEngine.test.js`. Expected: the new tests FAIL (`undefined` properties).
- [ ] **Step 3: Implement** the fields in `subsidyResult`, using the existing `csPolyFor`, `psPolyFor`, `clipPoly`, `shoelaceArea`. Return an area of 0 when a clipped poly has fewer than 3 points.
- [ ] **Step 4: Run** the same command. Expected: PASS. Then `npm run test`: all green.
- [ ] **Step 5: Commit** `feat(engine): subsidy CS/PS triangles, marginal CS/PS bands and overlap area`.

---

### Task 2: Renderer — named layers, captions and entry animations

Refactor only. The default output for every existing page must stay the same.

**Files:**
- Modify: `src/lib/marketChart.js`, `src/styles/pages.css`
- Test: `src/lib/marketChart.test.js`

**Interfaces:**
- Produces `export const LAYERS` (frozen array of names): `'demand', 'supply', 'supply2', 'eq1', 'eq2', 'prices', 'control', 'wedgeBox', 'cs', 'ps', 'overlap', 'taxWedges', 'dwl', 'csTriangle', 'psTriangle', 'marginalCs', 'marginalPs', 'govFill', 'subsidyBracket', 'badges', 'areaNames', 'focusChip'`.
- Produces `export function resolveLayers(result, { detail = 'full', layers, focus = null, showSurplusLabels = false }) => Set<string>`. With `layers` given, it returns `new Set(layers)`. Otherwise it returns the set today's renderer draws for that result and detail:
  - Always `demand`, `supply`, `eq1`.
  - `supply2` when the supply curve is shifted.
  - `eq2`, `prices` and `wedgeBox` when `hasOpenWedge`.
  - `control` for a binding ceiling or floor.
  - Fills: `cs`, `ps`, plus `taxWedges` (tax), `overlap` (subsidy) and `dwl` when there is a `dwlPoly`.
  - `badges` when `detail === 'full' && showSurplusLabels`.
  - `subsidyBracket` for a subsidy at `detail === 'full'`.
  - `areaNames` at `detail === 'ib'`.

  Task 3 changes the subsidy IB set and Task 4 adds `focus`.
- `renderMarketChart(svg, result, options)` gains these options:
  - `layers?: string[]`.
  - `captions?: { s1?: string, s2?: string, bracket?: string }`. `s1`/`s2` replace the S1/S2 curve label text; `bracket` replaces the money chip text on the subsidy bracket, and when given it is drawn at any detail level.
  - `enter?: string[]`: layers that fade in on this render.
  - `grow?: string[]`: fill layers that grow rightwards from the price axis on this render, delayed 400ms so they follow the fades.
- Every drawn element is wrapped in, or tagged with, `data-layer="<name>"`. Elements of a layer named in `enter` get class `layer-enter`; those in `grow` get `layer-grow`.

- [ ] **Step 1: Write the failing tests:**

```js
describe('layers', () => {
  const subsidy = () => computeMarket({ ...base, intervention: { type: 'subsidy', amount: 20 } });
  it('resolveLayers reproduces today\'s default set for a full-detail subsidy', () => {
    expect([...resolveLayers(subsidy(), { detail: 'full', showSurplusLabels: true })].sort()).toEqual(
      ['badges', 'cs', 'demand', 'dwl', 'eq1', 'eq2', 'overlap', 'prices', 'ps', 'subsidyBracket', 'supply', 'supply2', 'wedgeBox'].sort());
  });
  it('draws only the listed layers', () => {
    renderMarketChart(svg, subsidy(), { detail: 'clean', layers: ['demand'] });
    expect(svg.querySelectorAll('line.demand-curve')).toHaveLength(1);
    expect(svg.querySelector('line.supply-curve')).toBeNull();
    expect(svg.querySelector('[data-region="cs"]')).toBeNull();
    expect(svg.querySelector('.axis-symbol')).toBeNull();          // no eq1 → no Pe/Qe
  });
  it('ties axis symbols to their layers', () => {
    renderMarketChart(svg, subsidy(), { detail: 'clean', layers: ['demand', 'supply', 'supply2', 'eq1', 'eq2'] });
    const subs = [...svg.querySelectorAll('.axis-symbol')].map((t) => t.textContent);
    expect(subs).toEqual(expect.arrayContaining(['Pe', 'Qe', 'Q1']));
    expect(subs).not.toContain('Pc');
  });
  it('marks entering and growing layers only on the render that asks', () => {
    renderMarketChart(svg, subsidy(), { detail: 'clean', layers: ['demand', 'supply', 'supply2'], enter: ['supply2'] });
    expect(svg.querySelector('[data-layer="supply2"].layer-enter, [data-layer="supply2"] .layer-enter')).not.toBeNull();
    renderMarketChart(svg, subsidy(), { detail: 'clean', layers: ['demand', 'supply', 'supply2'] });
    expect(svg.querySelector('.layer-enter')).toBeNull();
  });
  it('uses captions for S1, S2 and the bracket', () => {
    renderMarketChart(svg, subsidy(), { detail: 'clean', layers: ['demand', 'supply', 'supply2', 'subsidyBracket'],
      captions: { s1: 'S1 = what it costs to make', s2: 'S2 = what customers need to pay', bracket: '$20 paid by government' } });
    expect(svg.textContent).toContain('S1 = what it costs to make');
    expect(svg.textContent).toContain('$20 paid by government');
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/lib/marketChart.test.js`. Expected: the new tests FAIL. Note the existing count so you can confirm it is unchanged later.
- [ ] **Step 3: Implement.**
  - In `renderMarketChart`, compute `const on = resolveLayers(result, options)` once and gate each existing drawing block on `on.has(name)`:
    - fills: `cs`, `ps`, `overlap` (including the `region-pop` groups) and `taxWedges`
    - curve lines and labels
    - the Pe/Qe guide lines and the e₁ dot → `eq1`
    - the Q₁ drop line and the e₂ dot → `eq2`
    - in `drawWedgeLines`: the reference lines → `prices`, the outline → `wedgeBox`, the control line → `control`
    - `drawEquilibriumLabels`: filter its points by `eq1`/`eq2`
    - `axisSymbols`: filter Pe/Qe by `eq1`, Pc/Pp by `prices`, Q₁ by `eq2`
  - Draw caption text through the existing label paths so placement and collision avoidance still apply.
  - Add CSS to `pages.css`:

```css
.market-chart .layer-enter { animation: layer-enter 400ms ease-out both; }
.market-chart .layer-grow { transform-box: fill-box; transform-origin: left center; animation: layer-grow 400ms ease-out 400ms both; }
@keyframes layer-enter { from { opacity: 0; } }
@keyframes layer-grow { from { transform: scaleX(0); } }
@media (prefers-reduced-motion: reduce) { .market-chart .layer-enter, .market-chart .layer-grow { animation: none; } }
```

- [ ] **Step 4: Run** `npm run test`. Expected: all green (the old count plus the new tests).
- [ ] **Step 5: Commit** `refactor(chart): draw by named layers; add captions and entry animations`.

---

### Task 3: Renderer — IB perfect subsidy shading and the area-label setting

**Files:**
- Modify: `src/lib/marketChart.js` (`resolveLayers`, fill block, `drawAreaNames`)
- Test: `src/lib/marketChart.test.js`

**Interfaces:**
- Consumes Task 1 fields and Task 2 `resolveLayers`.
- For `mode === 'subsidy' && detail === 'ib'` with no explicit `layers`, `resolveLayers` drops `cs`, `ps` and `overlap` and adds `csTriangle`, `psTriangle`, `marginalCs`, `marginalPs`. `dwl`, `wedgeBox` and `areaNames` stay.
- Fills and their `data-region` values:

  | Layer | `data-region` | Fill |
  |---|---|---|
  | `csTriangle` | `cs` | `var(--demand-fill)` |
  | `psTriangle` | `ps` | `var(--supply-fill)` |
  | `marginalCs` | `marginal-cs` | `var(--demand-alt-fill)` over a `var(--surface)` backing |
  | `marginalPs` | `marginal-ps` | `var(--supply-alt-fill)` over a `var(--surface)` backing |

  DWL is still drawn last, over these fills.
- New option `areaLabels?: 'full' | 'half' | 'none'` (default `'full'`). It only affects subsidy area names:
  - `full` names CS (in the triangle), PS, `marginal CS` (short form `mCS`), `marginal PS` (`mPS`), `government spending` (short form `Gov`) and `welfare loss` (`WL`). The government spending name goes just right of the box (x past `sx(Q) + 12`), centred between Pc and Pp, `text-anchor: start`, and is dropped if it would leave the plot or overlap another label.
  - `half` names only marginal CS and marginal PS.
  - `none` names nothing.

- [ ] **Step 1: Write the failing tests:**

```js
describe('IB perfect subsidy', () => {
  const r = () => computeMarket({ ...base, intervention: { type: 'subsidy', amount: 20 } });
  const names = () => [...svg.querySelectorAll('.area-name')].map((t) => t.textContent);
  it('shades the triangles and marginal bands, with no overlap stripes', () => {
    renderMarketChart(svg, r(), { detail: 'ib' });
    expect(svg.querySelector('[data-region="subsidy-overlap"]')).toBeNull();
    expect(svg.querySelector('[data-region="marginal-cs"] polygon')).not.toBeNull();
    expect(svg.querySelector('[data-region="marginal-ps"] polygon')).not.toBeNull();
    expect(svg.querySelector('[data-region="dwl"]')).not.toBeNull();
    expect(svg.querySelector('[data-region="subsidy-cost"]')).not.toBeNull();
  });
  it('names every area at areaLabels full', () => {
    renderMarketChart(svg, r(), { detail: 'ib', areaLabels: 'full' });
    expect(names()).toEqual(expect.arrayContaining(['CS', 'PS', 'welfare loss']));
    expect(names().some((n) => /marginal CS|mCS/.test(n))).toBe(true);
  });
  it('names only the marginal bands at half, and nothing at none', () => {
    renderMarketChart(svg, r(), { detail: 'ib', areaLabels: 'half' });
    expect(names().every((n) => /marginal|^m(CS|PS)$/.test(n))).toBe(true);
    renderMarketChart(svg, r(), { detail: 'ib', areaLabels: 'none' });
    expect(names()).toEqual([]);
  });
  it('leaves Full and Clean subsidy shading as before', () => {
    renderMarketChart(svg, r(), { detail: 'clean' });
    expect(svg.querySelector('[data-region="subsidy-overlap"]')).not.toBeNull();
    expect(svg.querySelector('[data-region="marginal-cs"]')).toBeNull();
  });
});
```

  Also update any existing IB-perfect subsidy assertion in `marketChart.test.js` that expects the old stripes or `csOnlyPoly` names. Keep the tax and price-control IB tests unchanged.
- [ ] **Step 2: Run** `npx vitest run src/lib/marketChart.test.js`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm run test`. Expected: all green.
- [ ] **Step 5: Commit** `feat(chart): IB perfect subsidy shows CS/PS triangles and marginal CS/PS; area-label setting`.

---

### Task 4: Renderer — Explorer focus

**Files:**
- Modify: `src/lib/marketChart.js`
- Test: `src/lib/marketChart.test.js`

**Interfaces:**
- Produces `export const FOCUS_IDS = Object.freeze(['cs', 'ps', 'overlap', 'gov', 'dwl'])`.
- Option `focus?: FocusId | null`. When set, `resolveLayers` returns the curve layers (`demand`, `supply`, `supply2`, `eq1`, `eq2`, `prices`, whichever apply) plus the focus fill and `focusChip`, and nothing else:
  - `cs` → layer `cs` (`result.csPoly`)
  - `ps` → layer `ps` (`result.psPoly`)
  - `overlap` → layer `overlap`
  - `gov` → `govFill` (`wedgePoly` filled `var(--gov-fill)`, `data-region="subsidy-cost"`) plus `wedgeBox`
  - `dwl` → layer `dwl`

  On a free market, `overlap`, `gov` and `dwl` draw no fill and no chip.
- Focus styling:
  - `svg.dataset.focus = focus` (removed when there is no focus).
  - The original supply line gets `stroke-opacity="0.35"`.
  - The emphasised equilibrium dot gets `r="8"` and class `eq-dot--focus`: the e₂ dot when `hasOpenWedge`, otherwise the e₁ dot.
- `focusChip`: one `drawRegionBadge`, centred via `polygonCentroid` of the focused polygon, with text `"<label> <fmtMoney(value)>"`:

  | Focus | Label | Value |
  |---|---|---|
  | cs | `CS` | `result.CS` |
  | ps | `PS` | `result.PS` |
  | overlap | `Overlap` | `result.overlapArea` |
  | gov | `Gov` | `result.govCost` |
  | dwl | `DWL` | `result.DWL` |

  It is omitted when the value is ≤ 0.005.

- [ ] **Step 1: Write the failing tests:**

```js
describe('focus', () => {
  const r = (amount = 20) => computeMarket({ ...base, intervention: { type: amount ? 'subsidy' : 'none', amount } });
  it('removes every other shaded area', () => {
    renderMarketChart(svg, r(), { detail: 'ib', focus: 'cs' });
    const regions = [...svg.querySelectorAll('.fills [data-region]')].map((g) => g.dataset.region);
    expect(new Set(regions)).toEqual(new Set(['cs']));
  });
  it('fades S1 and enlarges e2', () => {
    renderMarketChart(svg, r(), { detail: 'ib', focus: 'cs' });
    expect(svg.querySelector('line.supply-curve').getAttribute('stroke-opacity')).toBe('0.35');
    expect(svg.querySelectorAll('.eq-dot--focus')).toHaveLength(1);
    expect(svg.querySelector('.eq-dot--focus').getAttribute('r')).toBe('8');
  });
  it('shows one chip with the focused area\'s dollar amount', () => {
    renderMarketChart(svg, r(), { detail: 'ib', focus: 'gov' });
    expect(svg.textContent).toContain('Gov $1,400');
    expect(svg.querySelectorAll('.surplus-badges, .area-name')).toHaveLength(0);
  });
  it('draws nothing to highlight for gov on a free market', () => {
    renderMarketChart(svg, r(0), { detail: 'ib', focus: 'gov' });
    expect(svg.querySelector('.fills [data-region]')).toBeNull();
    expect(svg.textContent).not.toContain('Gov $');
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/lib/marketChart.test.js`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm run test`. Expected: all green.
- [ ] **Step 5: Commit** `feat(chart): Explorer focus — one area, faded S1, enlarged equilibrium, single value chip`.

---

### Task 5: Region explainers — marginal CS/PS and the government-spending rewrite

**Files:**
- Modify: `src/lib/regionExplainers.js`
- Test: `src/lib/regionExplainers.test.js`

**Interfaces:**
- New `REGION_INFO` keys `'marginal-cs'` and `'marginal-ps'`, with `REGION_BADGES` `'mCS'` / `'mPS'`. `getStatValue` returns `fmtMoney(result.marginalCS)` / `fmtMoney(result.marginalPS)`.
- Copy:
  - `REGION_INFO['marginal-cs']`, title **Marginal Consumer Surplus**: "The extra consumer surplus the subsidy creates: consumers now pay Pc instead of Pe, on every unit they buy, including the extra units the subsidy makes worth buying."
  - `REGION_INFO['marginal-ps']`, title **Marginal Producer Surplus**: "The extra producer surplus the subsidy creates: producers now receive Pp instead of Pe, on every unit they sell, including the extra units the subsidy makes worth producing."
  - `REGION_INFO['subsidy-cost'].text`: "The government pays the subsidy on every unit sold. That money ends up in three places: lower prices for consumers (marginal CS), higher prices for producers (marginal PS), and a welfare loss nobody gets."
  - `getContextNote('subsidy-cost', result)` for `mode === 'subsidy'` returns the spec's live sentence, with `amount = result.Pp - result.Pc`: `` `The government pays ${fmtMoney(amount)} on each of the ${fmtQty(result.Q)} loaves sold, ${fmtMoney(result.govCost)} in all. That money ends up in three places: lower prices for consumers (marginal CS), higher prices for producers (marginal PS), and a welfare loss nobody gets.` ``

- [ ] **Step 1: Write the failing tests:** both new keys exist with a title and text. For the base subsidy result (amount 20), the `subsidy-cost` context note contains `'$20'`, `'70.0'` and `'$1,400'`, and the `marginal-cs` stat reads `'$650'`. Use the same helpers the existing tests in this file use to read the note and stat.
- [ ] **Step 2: Run** `npx vitest run src/lib/regionExplainers.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm run test`. Expected: all green.
- [ ] **Step 5: Commit** `feat(explainers): marginal CS/PS explainers; government spending explains its three parts`.

---

### Task 6: URL state — mode hash, view and focus params

**Files:**
- Create: `src/lib/pageMode.js`, `src/lib/pageMode.test.js`

**Interfaces:**
- `readMode(win = window) => 'explain' | 'play'`: `#explain` gives `'explain'`; anything else gives `'play'`.
- `writeMode(mode, win = window)`: `history.replaceState` to the same path and query with `#explain` or `#play`. Wrap it in try/catch.
- `onModeChange(cb, win = window) => () => void`: listens to `hashchange` and calls `cb(readMode(win))`. It returns an unsubscribe function.
- `readPlayView(win = window) => { view: 'ib' | 'explorer', focus: FocusId | null }`. It reads `?view=` and `?focus=`; a valid `focus` implies `view: 'explorer'`; invalid values are ignored. It imports `FOCUS_IDS` from `marketChart.js`.
- `writePlayView({ view, focus }, win = window)` keeps the URL in sync:
  - `view=explorer` is set only for Explorer. `focus` is set only when non-null.
  - Both params are deleted when the view is IB perfect.
  - Other params and the hash are preserved. It uses `replaceState` inside try/catch.

- [ ] **Step 1: Write the failing tests.** Use a fake `win` with a `location`, a `history.replaceState` spy, and `addEventListener`/`removeEventListener`. Cover:
  - `''` → play; `'#explain'` → explain; `'#foo'` → play.
  - `?view=bogus` → ib; `?focus=cs` → `{ view: 'explorer', focus: 'cs' }`; `?view=explorer&focus=nope` → `{ view: 'explorer', focus: null }`.
  - `writePlayView({ view: 'ib', focus: null })` on `?view=explorer&focus=cs&x=1#play` replaces the URL with `…?x=1#play`.
  - The `onModeChange` callback fires with `'explain'` after a dispatched `hashchange`.
- [ ] **Step 2: Run** `npx vitest run src/lib/pageMode.test.js`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat: URL state for subsidy Explain/Play mode and Explorer view/focus`.

---

### Task 7: Components — mode switch, view switch and focus bar

**Files:**
- Create: `src/components/modeSwitch.js`, `src/components/viewSwitch.js`, `src/components/modeSwitch.test.js`, `src/components/viewSwitch.test.js`
- Modify: `src/styles/pages.css`

**Interfaces:**
- `mountModeSwitch(chartHead, { mode, onChange }) => { setMode(mode) }` appends `.mode-switch`: a two-option segmented radio group, **Explain** | **Play** (`input[name="page-mode"]`, values `explain` / `play`). `onChange(mode)` fires on user change only; `setMode` does not fire it.
- `mountViewSwitch(chartHead, { view, focus, onChange }) => { set({ view, focus }) }` appends `.view-switch` (segmented **IB perfect** | **Explorer**, `input[name="play-view"]`, values `ib` / `explorer`). It inserts `.focus-bar` directly after `chartHead`.
  - The focus bar is hidden unless the view is Explorer.
  - It holds the prompt "Pick something to highlight:" and five `button.focus-chip`s with `data-focus` and `aria-pressed`, labelled **Consumer surplus**, **Producer surplus**, **Overlap**, **Government spending**, **Welfare loss**.
  - Clicking a pressed chip clears the focus.
  - `onChange({ view, focus })` fires on every user change. Switching to IB perfect clears the focus.
- CSS: style both switches like the existing `.detail-seg` (reuse its tokens). The focus bar wraps onto multiple lines at phone width with no horizontal scroll. Pressed chips use `--accent` / `--accent-fill`.

- [ ] **Step 1: Write the failing tests** (jsdom):
  - The mode switch renders two radios with the current one checked, and clicking Play calls `onChange('play')`.
  - The view switch hides `.focus-bar` at `ib` and shows it at `explorer`.
  - Clicking the **Overlap** chip calls `onChange({ view: 'explorer', focus: 'overlap' })` and sets `aria-pressed="true"`; clicking it again calls `onChange({ view: 'explorer', focus: null })`.
  - Choosing IB perfect calls `onChange({ view: 'ib', focus: null })`.
- [ ] **Step 2: Run** `npx vitest run src/components/modeSwitch.test.js src/components/viewSwitch.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat: Explain/Play mode switch and IB perfect/Explorer view switch with focus bar`.

---

### Task 8: Graph chrome — optional gear, view-switch tour step

**Files:**
- Modify: `src/components/graphChrome.js`
- Test: `src/pages/graph-chrome.integration.test.js` (extend it)

**Interfaces:**
- `initGraphChrome(doc, { chartHead, steps, onDetailChange, detailSettings = true })`: with `detailSettings: false` no gear is mounted and `getDetail()` returns `'ib'`. The replay button and `startTour` are unchanged.
- `interventionTourSteps({ policyName, sliderNoun, clickableRegions, viewSwitch = false })`: with `viewSwitch: true`, the final gear step is replaced by `{ target: '.view-switch', title: 'Switch views.', text: 'IB perfect is the diagram to draw in an exam; Explorer lets you highlight one area at a time.' }`.

- [ ] **Step 1: Write the failing tests:**
  - `detailSettings: false` → no `.detail-gear` in the document.
  - `viewSwitch: true` → the last step targets `.view-switch` and no step targets `.detail-gear`.
  - The defaults still produce the gear step, so existing pages are unchanged.
- [ ] **Step 2: Run** `npx vitest run src/pages/graph-chrome.integration.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm run test`. Expected: all green.
- [ ] **Step 5: Commit** `feat(chrome): pages can opt out of the detail gear; tour step for the view switch`.

---

### Task 9: Explain card and the subsidy step script

**Files:**
- Create: `src/components/explainCard.js`, `src/components/explainCard.test.js`, `src/pages/subsidyExplainSteps.js`, `src/pages/subsidyExplainSteps.test.js`
- Modify: `src/styles/pages.css`

**Interfaces:**
- A step is `{ id: string, headline: (ctx) => string, text: (ctx) => string, slider: boolean, subsidy: boolean, layers?: string[], enter?: string[], grow?: string[], captions?: (ctx) => object, view?: 'ib', finish?: true }`, where `ctx = { amount: number, result }`.
- `SUBSIDY_STEPS` (exported from `subsidyExplainSteps.js`) is an 11-step array, in this order. Copy is quoted from the spec, with `$X` = `fmtMoney(amount)`. Steps 3–11 have `slider: true` and `subsidy: true`.

  | # | id | layers (`enter` = new this step) | grow | captions |
  |---|---|---|---|---|
  | 1 | `demand` | demand | – | – |
  | 2 | `supply` | + supply, eq1 | – | s1 "S1 = what it costs to make" |
  | 3 | `subsidy` | + supply2, subsidyBracket | – | s1 as above; s2 "S2 = what customers need to pay"; bracket "$X paid by government" |
  | 4 | `equilibrium` | + eq2 | – | s1, s2, bracket |
  | 5 | `prices` | + prices | – | s1, s2, bracket |
  | 6 | `producer` | (bracket dropped) + psTriangle, marginalPs | marginalPs | s1, s2 |
  | 7 | `consumer` | + csTriangle, marginalCs | marginalCs | s1, s2 |
  | 8 | `overlap` | swap the triangles and bands for cs, ps, overlap (overlap in `enter`) | – | s1, s2 |
  | 9 | `government` | step 7's set + wedgeBox | – | s1, s2 |
  | 10 | `welfare` | + dwl | – | s1, s2 |
  | 11 | `wrap` | `view: 'ib'`, no layers, `finish: true` | – | – |

  Headline and text per step:

  | # | Headline | Text |
  |---|---|---|
  | 1 | Demand | "This is demand: how many loaves people want to buy at each price. Lower price, more loaves." |
  | 2 | Supply | "This is supply: what it costs the bakery to bake each extra loaf. Where it meets demand is the market price, Pe." |
  | 3 | "The bakery's costs don't change, so S1 stays put." | "The government pays $X per loaf, so the bakery needs $X less from each customer. That's S2." |
  | 4 | A new equilibrium | "More loaves are sold, Q₁ instead of Qe, because customers pay less." |
  | 5 | Two prices | "Customers pay Pc. The bakery receives Pp: what the customer pays plus $X from the government." |
  | 6 | Producer surplus shifts | "Producers gain this extra band: they now receive Pp instead of Pe." |
  | 7 | Consumer surplus shifts | "Consumers gain this band: they now pay Pc instead of Pe." |
  | 8 | Notice the overlap | "Look: part of the area is counted as both consumer *and* producer surplus. It's the same money, and the government pays for it." |
  | 9 | Government spending | "The government pays $X × Q₁ in total. That's this whole box: the consumers' gain, the producers' gain, plus one more piece…" |
  | 10 | Welfare loss | "…this triangle. Those last loaves cost more to make (S1) than buyers value them (D), so society loses this much." |
  | 11 | The full diagram | "That's the full subsidy diagram, the one you'd draw in an exam." |

  Step 4's "Q₁" and step 9's total use live values (`fmtQty(result.Q)`, `fmtMoney(result.govCost)`) appended in parentheses.
- `mountExplainCard(container, { steps, amount, min = 0, max = 60, getContext, onRender, onAmount, onFinish, isValidAmount }) => { goTo(index), index(), refresh() }`:
  - **Markup:** "Step n of N" (`.explain-card__count`), `h3` headline, `p` text, a range input `.explain-slider` (only on steps with `slider`), Back / Next buttons and dots (`.explain-dot`, one per step, the current one with `aria-current="step"`). On the last step, Next is replaced by a **Try it in Play →** button that calls `onFinish()`.
  - **Navigation:** Back/Next and ArrowLeft/ArrowRight (ignored while focus is on the range input) move between steps. Back is disabled on step 1.
  - **Rendering:** `goTo` calls `onRender(step, { animate: true })`. Slider input calls `onAmount(value)` and then `onRender(step, { animate: false })`, and re-renders the headline and text from `getContext()`. `isValidAmount` guards the slider via `guardSliders`.
- CSS: `.explain-card` is a `.card` styled step card. `@media (prefers-reduced-motion: reduce)` drops any card transitions.

- [ ] **Step 1: Write the failing tests:**
  - `subsidyExplainSteps.test.js`:
    - There are 11 steps with the ids above, in order.
    - No step's `layers` ever omits `supply` once step 2 has added it (the S1-never-moves anti-goal). The exception is step 11, which uses `view: 'ib'`.
    - Step 3's captions at amount 20 include `'$20 paid by government'`.
    - Steps 1–2 have `subsidy: false`.
  - `explainCard.test.js`:
    - The card renders "Step 1 of 11" with Back disabled.
    - Next calls `onRender` with `animate: true` and shows step 2.
    - On step 3, the slider exists, and an input event calls `onAmount` and then `onRender` with `animate: false`.
    - On step 11, the **Try it in Play →** button calls `onFinish`.
    - ArrowRight advances.
- [ ] **Step 2: Run** `npx vitest run src/components/explainCard.test.js src/pages/subsidyExplainSteps.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat: Explain step card and the 11-step subsidy walkthrough script`.

---

### Task 10: Subsidy page — wire Explain and Play together

**Files:**
- Modify: `units/microeconomics/government-intervention/subsidy.html`, `src/pages/subsidy.js`, `src/lib/pageControls.js`, `src/styles/pages.css`
- Test: `src/pages/subsidy.test.js`, `src/pages/subsidy.integration.test.js` (update `buildDom` to match the new markup)

**Interfaces:**
- Consumes Tasks 2–9.
- `pageControls.js` gains `export const DEFAULT_MARKET`, the market `readCurveParams` gives at all-zero sliders (`{ demand: 160, supply: 0, slopeD: 4/3, slopeS: 4/3 }`; derive it from `readCurveParams`, don't hard-code it).
- `subsidy.js` exports `export const SUBSIDY_AREA_LABELS = 'full';` with the comment `// 'full' | 'half' | 'none' — Ms. Patel request 3; flip after she confirms.`
- **HTML changes:**
  - id `outcome-panel` on the Market outcome section.
  - `<section class="card explain-card" id="explain-card" hidden></section>` directly after the chart card inside `.main-col`.
  - `data-legend` keys on every legend item: `demand`, `supply`, `cs`, `ps`, `overlap`, `gov`, `dwl`. Add new legend items `marginal-cs` ("Marginal consumer surplus", `--demand-alt-fill` swatch) and `marginal-ps` ("Marginal producer surplus", `--supply-alt-fill` swatch).
  - The two stat tiles "Consumer benefit" / "Producer benefit" are renamed "Marginal consumer surplus" / "Marginal producer surplus" and filled from `result.marginalCS` / `marginalPS` (`$0` when the subsidy is off).
- **Behaviour in `initSubsidyPage(doc, win = window)`:**
  - `initGraphChrome(..., { detailSettings: false, steps: … interventionTourSteps({ …, viewSwitch: true }) })`, then `mountModeSwitch` and `mountViewSwitch` on `.chart-head`.
  - `doc.body.dataset.mode` is `'explain'` or `'play'` from `readMode(win)`, updated by the mode switch (`writeMode`) and by `onModeChange`.
  - CSS: `body[data-mode="explain"]` hides `.sidebar`, `#outcome-panel`, `.legend`, `.view-switch` and `.focus-bar`, and makes `.layout` one column. `body[data-mode="play"]` hides `#explain-card`.
  - **Play render:** today's `render()`. `detail` is always `'ib'`; `focus` is the Explorer focus (null in IB perfect); `areaLabels` is `SUBSIDY_AREA_LABELS`.
    - Legend items are hidden or shown to match what is drawn. IB perfect / Explorer without a focus shows everything except `overlap`; with a focus it shows demand, supply and the focused item (`cs`, `ps`, `overlap`, `gov`, `dwl`).
    - In Explorer, `#market-note` shows "Turn the subsidy on to see the overlap." / "…government spending." / "…the welfare loss." when that focus has nothing to show (subsidy off).
    - The view state comes from `readPlayView(win)` and is kept in sync via `writePlayView`.
  - **Explain render:** `computeMarket({ ...DEFAULT_MARKET, intervention })`, where `intervention` is `{ type: 'subsidy', amount }` if `step.subsidy`, otherwise `{ type: 'none' }`. Render with `{ detail: step.view === 'ib' ? 'ib' : 'clean', layers: step.layers, captions: step.captions?.(ctx), areaLabels: SUBSIDY_AREA_LABELS }`, plus `enter` / `grow` only when `animate`.
    - The Explain slider and `#subsidy-slider` share one amount: each writes the other's value.
    - Entering Explain always calls `card.goTo(0)`.
  - **Try it in Play →** switches mode to play. If `#subsidy-toggle` is off, it sets it checked and dispatches `change`, so the existing tween animates the subsidy on.
  - **Tour:** `maybeAutoStartTour(chrome)` runs only when the page is in Play, either on load or the first time the student switches to Play during this page load.
  - Region explainers stay attached to `#chart` in both modes.

- [ ] **Step 1: Write the failing tests.**
  - In `subsidy.test.js` (pass a fake `win` whose `location.hash` / `search` you control):
    - A bare URL lands in play: no `.detail-gear`, `.view-switch` present, and the chart has `data-detail="ib"` with no `[data-region="subsidy-overlap"]`.
    - `#explain` → `body[data-mode="explain"]`, the explain card shows "Step 1 of 11", and the chart has no `line.supply-curve`.
    - `?view=explorer&focus=cs#play` → only `[data-region="cs"]` among the fills.
    - Explorer focus `gov` with the toggle off → `#market-note` contains "Turn the subsidy on".
    - On step 3, after a slider input, the chart has no `.layer-enter` (Review Focus 2).
    - **Try it in Play →** on step 11 → mode play, `#subsidy-toggle` checked, and `#stat-cost` reads `$1,350`.
    - The marginal CS tile reads `$637.50` with the subsidy on at $20. Use the value `fmtMoney` actually produces for 637.5; check `src/lib/format.js` and assert it exactly.
  - In `subsidy.integration.test.js`: against the real HTML, `#explain-card`, `#outcome-panel` and every `data-legend` key listed above exist.
- [ ] **Step 2: Run** `npx vitest run src/pages/subsidy.test.js src/pages/subsidy.integration.test.js`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm run test`. Expected: all green.
- [ ] **Step 5: Manual check.** Run `npm run dev`, open `/units/microeconomics/government-intervention/subsidy.html#explain`, click through all 11 steps, drag the slider on step 3 and step 8, and press **Try it in Play →**. Then open `?focus=overlap#play` and confirm only the stripes show. Check a 375px-wide viewport for horizontal scroll.
- [ ] **Step 6: Commit** `feat(subsidy): Explain walkthrough and Play with IB perfect / Explorer views`.

---

### Task 11: Family page — the Subsidy tile splits into Explain / Play

**Files:**
- Create: `src/components/tileSplit.js`, `src/components/tileSplit.test.js`
- Modify: `src/lib/units.js` (add `modes: ['explain', 'play']` to the subsidy diagram), `src/components/bento.js`, `src/pages/government-intervention.js`, `src/styles/pages.css`
- Test: `src/lib/units.test.js`, `src/pages/government-intervention` tests if present (`ls src/pages | grep government` shows `government-intervention.test.js` / `.integration.test.js`)

**Interfaces:**
- `diagramModeLinks(unit, family, diagram, base = import.meta.env.BASE_URL) => Array<{ mode, label, href }>`: for a built diagram with `modes`, returns `[{ mode: 'explain', label: 'Explain', href: '<diagramHref>#explain' }, { mode: 'play', label: 'Play', href: '<diagramHref>#play' }]`; otherwise `[]`.
- `renderBento` items may carry `modes` (that array). For such tiles `bento.js` calls `enableTileSplit(tile, item.modes)`. The tile's own `href` is unchanged (the bare page, i.e. Play), so it still works without JS.
- `enableTileSplit(tile, modes) => { restore() }`:
  - **Split:** a `click` on the tile (which also covers Enter) calls `preventDefault`, hides the tile, and inserts one `div.bento__split` right after it. That div holds one `a.bento__mode.bento__mode--<mode>` per mode, keeps the tile's accent classes, and takes the tile's grid footprint. Focus moves to the Explain link.
  - **Repeat activation:** while split, a second activation does nothing.
  - **Restore:** Escape, or a click outside the split, removes it, unhides the tile, and focuses the tile.
  - **CSS:** the split's links animate in with `bento-split-in` (opacity plus a slight scale, 300ms), turned off under reduced motion.

- [ ] **Step 1: Write the failing tests:**
  - `units.test.js`: `diagramModeLinks` for subsidy ends with `#explain` / `#play`, and returns `[]` for the price ceiling.
  - `tileSplit.test.js`:
    - A click yields exactly one `.bento__split` with two links, and the tile is hidden.
    - A second click still yields one (Review Focus 5).
    - Escape removes the split and focuses the tile.
    - The click event's `defaultPrevented` is true.
  - The family-page test: the Subsidy tile splits and the Indirect tax tile doesn't (no `.bento__split` after clicking it).
- [ ] **Step 2: Run** `npx vitest run src/lib/units.test.js src/components/tileSplit.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm run test`. Expected: all green. Run `npm run build`. Expected: build succeeds.
- [ ] **Step 5: Manual check.** In `npm run dev`, on the Government Intervention page, click Subsidy, tab to Play, press Escape, and confirm the tile returns.
- [ ] **Step 6: Commit** `feat(family): Subsidy tile splits into Explain and Play`.

---

### Task 12: Docs — record the new rules

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-09-24-ib-econ-graph-site-design.md`, `docs/superpowers/specs/2026-10-25-graph-onboarding-and-detail-settings-design.md`, `docs/teacher-feedback.md`, `docs/superpowers/specs/2026-10-27-subsidy-explain-and-play-design.md` (Status: implemented)

- [ ] **Step 1: Edit.**
  - **`CLAUDE.md` "Definition of done":** note that the subsidy page is the pilot of Explain/Play. It has no detail gear: there's an IB perfect / Explorer view switch instead, its tour step targets `.view-switch`, and `SUBSIDY_AREA_LABELS` is the label contingency. The renderer draws by named layers (`resolveLayers`), and any new drawn element must belong to a layer. Point to the new spec.
  - **Onboarding spec:** add a dated note that the subsidy page replaces the gear.
  - **`teacher-feedback.md`:** tick request 1 (dated 2026-10-27). Mark 3 and 4 as partially done, with what's left: Ms. Patel confirms labels and the price-control scope, and confirms the new government spending treatment reads clearly.
- [ ] **Step 2: Run** `npm run test`. Expected: all green (a docs-only task, but confirm nothing drifted).
- [ ] **Step 3: Commit** `docs: record subsidy Explain/Play rules and feedback status`.

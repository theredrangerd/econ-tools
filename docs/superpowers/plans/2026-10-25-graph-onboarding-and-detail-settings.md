# Graph Onboarding + Detail Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-time, skippable spotlight walkthrough and a Full / Clean / IB perfect detail setting (gear on the chart) to every graph page, wired into the four Government Intervention pages.

**Architecture:** A tiny prefs module owns persistence (localStorage + `?detail=` URL param). `renderMarketChart` gains a `detail` option that decides chips, explainers, plain area names and tick numbers. Two shared components (detail-settings gear/popover, tour + bottom-left replay button) are injected by JS, so the HTML pages don't change. A `initGraphChrome` helper glues them together for any graph page; each page supplies its own tour steps.

**Tech Stack:** Plain ES modules, Vite multi-page, Vitest + jsdom, CSS in `src/styles/pages.css` using `src/styles/tokens.css` tokens. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-25-graph-onboarding-and-detail-settings-design.md`

## Global Constraints

- Detail levels, in order: `'full'` (Full explanation), `'clean'` (Clean), `'ib'` (IB perfect). Default for a new visitor: `'full'`.
- Full explanation = today's chart exactly. The setting only removes things; nothing new appears at Full.
- Market outcome panel and sidebar controls are identical at every level.
- Walkthrough runs automatically once per browser, site-wide, on the first visit to any graph page. If storage is unavailable, it does **not** auto-run; the replay button still works.
- Replay button: fixed bottom-left of the viewport on every graph page.
- Tour copy says what you can *do*, never what it teaches. No hint text beyond the fixed step copy.
- Real-pixel chart text: new on-chart labels get their own class (`area-name`). Don't reuse `.tick-label`.
- Colours and spacing from existing tokens (`--accent`, `--accent-fill`, `--ink`, `--surface`, `--hairline`, …). Respect `prefers-reduced-motion`.
- Wrap every `localStorage` access in try/catch.
- localStorage keys: `econ.detail`, `econ.tourSeen`. URL param: `detail` with values `full|clean|ib`.

## Review Focus

1. **Deep link `?detail=ib` on a first visit:** tour auto-runs with 3 steps (no "tap a shaded area"), and the gear shows IB perfect selected. Test in Task 6.
2. **Changing detail while an explainer popover is open:** the popover closes. It must not stay floating over a chart that is no longer clickable. Test in Task 3 (close handle) and Task 6 (wired on change).
3. **localStorage throws (private mode / blocked):** the page renders at Full, no tour auto-runs, and the gear still switches levels for the session. Test in Task 1 and Task 6.
4. **Toggle animation / slider drag at Clean/IB:** every re-render keeps the chosen level (detail is read on each render, not only at init). Test in Task 7.
5. **Narrow phone (<880px, stacked columns):** the tour target is scrolled into view and the bubble stays inside the viewport. Test in Task 5 (bubble clamped to viewport) plus a manual check in Task 8.

---

### Task 1: Preferences module

**Files:**
- Create: `src/lib/prefs.js`
- Test: `src/lib/prefs.test.js`

**Interfaces:**
- Produces:
  - `DETAIL_LEVELS: readonly ['full','clean','ib']`
  - `getDetailLevel(win = window): 'full'|'clean'|'ib'`: a valid `?detail=` URL param wins, then a valid stored `econ.detail`, else `'full'`.
  - `setDetailLevel(level, win = window): void`: stores `econ.detail`. If the URL has a `detail` param, removes it with `history.replaceState` so a reload reflects the new choice. A URL-provided level is never written to storage by `getDetailLevel`.
  - `hasSeenTour(win = window): boolean`: `true` if `econ.tourSeen === '1'` **or storage throws**.
  - `markTourSeen(win = window): void`

- [ ] **Step 1: Write failing tests** in `prefs.test.js` (`beforeEach`: `localStorage.clear()`; `history.replaceState(null, '', '/')`):
  - `getDetailLevel()` → `'full'` when nothing is set.
  - With `localStorage.setItem('econ.detail','clean')` → `'clean'`.
  - Stored `'clean'` plus URL `?detail=ib` → `'ib'`, and storage is still `'clean'`.
  - Invalid values (`?detail=banana`, stored `'x'`) fall through → `'full'`.
  - `setDetailLevel('ib')` → `localStorage.getItem('econ.detail') === 'ib'`. When the URL had `?detail=clean&x=1`, afterwards `location.search === '?x=1'`.
  - `hasSeenTour()` is `false`, then `markTourSeen()`, then `true`.
  - With a fake `win` whose `localStorage.getItem` throws: `hasSeenTour(win) === true`, `getDetailLevel(win) === 'full'`, and `setDetailLevel('ib', win)` doesn't throw.
- [ ] **Step 2:** Run `npx vitest run src/lib/prefs.test.js`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `src/lib/prefs.js` per the Interfaces block.
- [ ] **Step 4:** Run the test again. Expected: PASS.
- [ ] **Step 5:** Commit: `git add src/lib/prefs.js src/lib/prefs.test.js && git commit -m "feat: add detail-level and tour-seen preferences"`

---

### Task 2: `detail` option in `renderMarketChart`

**Files:**
- Modify: `src/lib/marketChart.js`. Touches `renderMarketChart` (~line 698), `drawSurplusBadges` (~641), `drawSubsidyBracket` (~591), the tick-visibility tail of `renderMarketChart`, and a new `drawAreaNames`.
- Modify: `src/styles/pages.css` (add `.market-chart .area-name` next to `.bracket-label`, ~line 690)
- Test: `src/lib/marketChart.test.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `renderMarketChart(svg, result, { showSurplusLabels, detail = 'full' })`. It sets `svg.dataset.detail = detail` on every render. Behaviour:
  - `'full'`: unchanged from today.
  - `'clean'`: no region badges (skip `drawSurplusBadges` whatever `showSurplusLabels` is). The subsidy-amount chip stays. Ticks unchanged.
  - `'ib'`: no region badges, no subsidy-amount chip (the bracket line itself stays), all `.tick-label` elements set `visibility="hidden"` (including the `noTrade` branch, which currently forces them visible). Calls `drawAreaNames(layer, result)`.
- `drawAreaNames(layer, result)` (module-private): draws `<text class="area-name">` (fill `var(--ink)`, no pill, not a `data-region`) for each region present, using the same placement helpers as the badges. Use `polygonCentroid(poly, placed, { halfW, halfH })` for CS/PS/DWL, and `wedgeChipCenter` for the wedge bands. Push each placed rect into `placedLabels`. Names (full form → fallback short form when `scale < 1` at full width; omit if `scale == null` for both):
  - CS → `CS`; PS → `PS`; DWL → `welfare loss` / `WL`
  - tax: `consumerWedgePoly` → `consumer burden` / `CB`; `producerWedgePoly` → `producer burden` / `PB`
  - subsidy: `wedgePoly` → `government spending` / `Gov`; CS/PS use `csOnlyPoly || csPoly` / `psOnlyPoly || psPoly`, as `drawSurplusBadges` does.
  - Estimate width as `text.length * 7 + 4` px at 13px, `halfH = 9`.
- CSS: `.market-chart .area-name { font-size: 13px; font-weight: 600; fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; pointer-events: none; }`

- [ ] **Step 1: Write failing tests** (base market `{ demand:140, supply:20, slopeD:1, slopeS:1 }`; ceiling at price 50; specific tax amount 30; subsidy amount 30):
  - `detail: 'full'` with `showSurplusLabels: true` on the ceiling → `.region-badge` count > 0, no `.area-name`, `svg.dataset.detail === 'full'`.
  - `detail: 'clean'` with `showSurplusLabels: true` → zero `.region-badge--cs/--ps/--dwl`, no `.area-name`, and tick labels not all hidden.
  - `detail: 'ib'` on the ceiling → zero `.region-badge`; the `.area-name` texts include `CS`, `PS`, and one of `welfare loss`/`WL`; every `.tick-label` has `visibility="hidden"`.
  - `detail: 'ib'` on the tax → the area names include one of `consumer burden`/`CB` and one of `producer burden`/`PB`.
  - `detail: 'ib'` on the subsidy → no `.region-badge--subsidy-amount`, and the area names include one of `government spending`/`Gov`.
  - `detail: 'clean'` on the subsidy → `.region-badge--subsidy-amount` still present (when it fits at the default size).
  - Re-render `'ib'` then `'full'` on the same svg → no `.area-name` left over, and tick labels are visible again apart from those hidden by axis-symbol collision. Assert that at least one is not hidden.
- [ ] **Step 2:** Run `npx vitest run src/lib/marketChart.test.js`. Expected: new tests FAIL; existing ones pass.
- [ ] **Step 3:** Implement per the Interfaces block. `drawAxisSymbols` already sets tick visibility per render, so apply the IB hide **after** it.
- [ ] **Step 4:** Run the test again. Expected: all PASS.
- [ ] **Step 5:** Commit: `git add src/lib/marketChart.js src/lib/marketChart.test.js src/styles/pages.css && git commit -m "feat(chart): detail option — clean hides chips, ib draws plain area names and hides tick numbers"`

---

### Task 3: Explainers respect the detail level

**Files:**
- Modify: `src/lib/regionExplainers.js` (`attachRegionExplainers`, ~line 118)
- Modify: `src/styles/pages.css` (region rules ~line 692)
- Test: `src/lib/regionExplainers.test.js`

**Interfaces:**
- Consumes: `svg.dataset.detail` (set by Task 2).
- Produces: `attachRegionExplainers(svg): { close(): void }`. The `pointerover`, `click` and `keydown` handlers return early unless `(svg.dataset.detail ?? 'full') === 'full'`. `close()` closes any open popover and clears the active/hover classes.
- CSS: `.market-chart:not([data-detail="full"]) .region { cursor: default; }`, and disable the badge/fill hover "pop" under the same selector. `data-detail` is always set after the first render.

- [ ] **Step 1: Write failing tests:**
  - Render the ceiling with `detail: 'clean'`, attach, and dispatch `click` on `[data-region="cs"]` → no `.region-popover` in `document.body`.
  - Render with `'full'`, attach, click CS → a popover exists. Then call the returned `close()` → no popover.
- [ ] **Step 2:** Run `npx vitest run src/lib/regionExplainers.test.js`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5:** Commit: `git add src/lib/regionExplainers.js src/lib/regionExplainers.test.js src/styles/pages.css && git commit -m "feat(explainers): only active at Full explanation; expose close()"`

---

### Task 4: Detail settings gear + popover

**Files:**
- Create: `src/components/detailSettings.js`
- Modify: `src/styles/pages.css` (new `.detail-gear`, `.detail-popover`, `.detail-seg` block after `.status-pill` rules ~line 476)
- Test: `src/components/detailSettings.test.js`

**Interfaces:**
- Consumes: `DETAIL_LEVELS` from Task 1.
- Produces: `mountDetailSettings(chartHead: Element, { level, onChange }): { gear: HTMLButtonElement, setLevel(level): void }`
  - Appends `<button class="detail-gear" type="button" aria-label="Graph detail settings" aria-expanded="false" aria-controls="detail-popover">` (an inline SVG gear icon) to `chartHead`, after the status pill.
  - Clicking it toggles `#detail-popover.detail-popover` (hidden attribute). The popover is positioned under the gear, inside the chart card.
  - Popover content (exact copy): heading `Graph detail`, then a `role="radiogroup"` segmented control of three `<input type="radio" name="detail-level">` with labels `Full explanation`, `Clean`, `IB perfect` (values `full`, `clean`, `ib`), then `<p class="detail-popover__hint">IB perfect = exactly what an exam diagram needs.</p>`.
  - Changing a radio calls `onChange(value)`. The popover stays open so the student sees the chart change.
  - Esc, or a click outside the gear and popover, closes it and restores `aria-expanded="false"`.
- CSS: the gear is a 32px square, `border: 1px solid var(--hairline)`, hover/active uses `--accent` / `--accent-fill`. The selected segment uses `--accent-fill` with `--accent` text. `.chart-head` already lays out title + pill; the gear goes after the pill with a small gap.

- [ ] **Step 1: Write failing tests:**
  - Mount into `<div class="chart-head"><span id="status-pill"></span></div>` with `level: 'clean'` → `.detail-gear` exists, the popover is hidden, and the radio `value="clean"` is checked.
  - Click the gear → popover visible, `aria-expanded="true"`. Then click the `ib` radio and dispatch `change` → `onChange` called with `'ib'`.
  - Dispatch `keydown` Escape on document → popover hidden.
  - `setLevel('full')` → the full radio is checked.
- [ ] **Step 2:** Run `npx vitest run src/components/detailSettings.test.js`. Expected: FAIL.
- [ ] **Step 3:** Implement the component and CSS.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5:** Commit: `git add src/components/detailSettings.js src/components/detailSettings.test.js src/styles/pages.css && git commit -m "feat: detail settings gear with Full / Clean / IB perfect"`

---

### Task 5: Spotlight tour + replay button

**Files:**
- Create: `src/components/tour.js`
- Modify: `src/styles/pages.css` (new `.tour-*` block at end of file)
- Test: `src/components/tour.test.js`

**Interfaces:**
- Produces:
  - `startTour(doc, steps: Array<{ target: string|Element, title: string, text: string }>, { onDone } = {}): { end(): void }`
    - Steps whose target doesn't resolve are dropped before starting. If none remain, it returns immediately and calls `onDone`.
    - DOM:
      - `.tour-backdrop`: fixed, full-viewport, click-blocking.
      - `.tour-spotlight`: fixed rect over the target, padded 6px, with `box-shadow: 0 0 0 9999px rgb(0 0 0 / .55)` for the dimming.
      - `.tour-bubble` with `role="dialog"` and `aria-labelledby`. It contains `.tour-bubble__count` ("Step N of M"), `<strong>` title, text, a `Skip tour` button (`.tour-skip`, absent on the last step) and a primary button (`.tour-next`) reading `Next →`, or `Got it` on the last step.
    - Each step calls `target.scrollIntoView({ block: 'center', behavior })` before positioning. `behavior` is `'auto'` under reduced motion or when `scrollIntoView` is missing (jsdom), else `'smooth'`.
    - The bubble sits below the target when there's room, else above, else beside it. It's then clamped so all four edges are ≥12px inside the viewport.
    - Esc = skip. Skip, `Got it` and `end()` all remove every tour element and document listener, then call `onDone` once. The primary button gets focus on each step.
  - `mountReplayButton(doc, onClick): HTMLButtonElement`: appends `<button class="tour-replay" type="button">` with a "?" glyph and the visible text `Replay tour` to `doc.body` (fixed bottom-left, 16px inset). Click calls `onClick`.
- CSS: the bubble uses `--surface`, `--hairline`, `--ink`; the primary button uses `--accent`. Spotlight move/fade transitions sit inside `@media (prefers-reduced-motion: no-preference)` only.

- [ ] **Step 1: Write failing tests** (jsdom: set `window.innerWidth = 1024; window.innerHeight = 768`, and give targets a stubbed `getBoundingClientRect`):
  - Two steps → bubble shows `Step 1 of 2` and the step 1 title. Click `.tour-next` → `Step 2 of 2`, the button reads `Got it`, and there's no `.tour-skip`. Click it → no `.tour-bubble`/`.tour-backdrop` left, and `onDone` was called once.
  - A missing target selector is dropped: 3 steps with 1 missing → `Step 1 of 2`.
  - Click `.tour-skip` on step 1 → everything removed, `onDone` called once. Escape on a fresh tour does the same.
  - Bubble clamping: a target rect at `{ left: 1000, top: 740, width: 40, height: 20 }` → the bubble's computed `left + offsetWidth <= 1012` and `top >= 12`. Stub `offsetWidth`/`offsetHeight` to 280/140.
  - `mountReplayButton(document, fn)`, then click → `fn` called. The button text contains `Replay tour`.
- [ ] **Step 2:** Run `npx vitest run src/components/tour.test.js`. Expected: FAIL.
- [ ] **Step 3:** Implement the component and CSS.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5:** Commit: `git add src/components/tour.js src/components/tour.test.js src/styles/pages.css && git commit -m "feat: spotlight walkthrough and replay button"`

---

### Task 6: `initGraphChrome` + intervention tour steps

**Files:**
- Create: `src/components/graphChrome.js`
- Test: `src/components/graphChrome.test.js`

**Interfaces:**
- Consumes: Task 1 (`getDetailLevel`, `setDetailLevel`, `hasSeenTour`, `markTourSeen`), Task 4 (`mountDetailSettings`), Task 5 (`startTour`, `mountReplayButton`).
- Produces:
  - `initGraphChrome(doc, { chartHead: Element, steps: (detail) => Step[], onDetailChange: (detail) => void }): { getDetail(): string, startTour(): void }`
    - It reads the level once via `getDetailLevel()` and keeps it in a closure. `getDetail()` returns the current value.
    - It mounts the gear with that level. The gear's `onChange(level)` calls `setDetailLevel(level)`, updates the closure, then calls `onDetailChange(level)`.
    - It mounts the replay button, which runs `startTour()`. `startTour()` calls the tour component with `steps(getDetail())`.
    - It does **not** auto-start. The page calls `maybeAutoStartTour(chrome)` after its first render, so tour targets have been laid out.
  - `maybeAutoStartTour(chrome, win = window): void`: if `!hasSeenTour(win)`, calls `markTourSeen(win)` **first** (closing the tab mid-tour still counts as seen), then `chrome.startTour()`.
  - `interventionTourSteps({ policyName, sliderNoun, clickableRegions }, detail): Step[]`: the exact copy below. Step 3 is included only when `clickableRegions && detail === 'full'`.
    1. target `.toggle-row--primary`, title `Turn the policy on and off.`, text `` `Flip this switch to impose the ${policyName} on the free market, and watch the graph change.` ``
    2. target `.sidebar`, title `Drag anything.`, text `` `These sliders move the ${sliderNoun}, shift demand and supply, and change how steep the curves are. Everything updates live.` ``
    3. target `#chart`, title `Tap a shaded area`, text `to see what it means and how big it is.`
    4. target `.detail-gear`, title `Change how much you see.`, text `This gear switches between a fully annotated diagram and IB perfect, the version to replicate on exams.`

- [ ] **Step 1: Write failing tests** (`beforeEach`: `localStorage.clear()`, reset the URL, body = `<div class="chart-head"></div><div class="toggle-row--primary"></div><aside class="sidebar"></aside><svg id="chart"></svg>`):
  - `interventionTourSteps({ policyName:'price ceiling', sliderNoun:'ceiling', clickableRegions:true }, 'full')` → 4 steps; step 1 text contains `impose the price ceiling`. The same call with `'ib'` → 3 steps and no `#chart` target.
  - `initGraphChrome` → `.detail-gear` and `.tour-replay` exist. Choosing `ib` in the gear → `onDetailChange('ib')`, `getDetail() === 'ib'`, `localStorage econ.detail === 'ib'`.
  - `maybeAutoStartTour` on a fresh store → `.tour-bubble` present and `econ.tourSeen === '1'`. After cleanup, calling it again → no bubble.
  - Review Focus 1: URL `?detail=ib`, fresh store → the gear's `ib` radio is checked, and the auto tour shows `Step 1 of 3`.
  - Review Focus 3: with a `win` whose storage throws → `maybeAutoStartTour(chrome, win)` shows no bubble.
- [ ] **Step 2:** Run `npx vitest run src/components/graphChrome.test.js`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5:** Commit: `git add src/components/graphChrome.js src/components/graphChrome.test.js && git commit -m "feat: graph chrome helper wiring detail settings and tour"`

---

### Task 7: Wire the four Government Intervention pages

**Files:**
- Modify: `src/pages/price-control.js`, `src/pages/price-ceiling.js`, `src/pages/price-floor.js`, `src/pages/indirect-tax.js`, `src/pages/subsidy.js`
- Test: the 4 `*.integration.test.js` files plus `price-ceiling.test.js` (its `buildDom` needs a `<div class="chart-head">` wrapping `#status-pill`)

**Interfaces:**
- Consumes: Task 6 (`initGraphChrome`, `maybeAutoStartTour`, `interventionTourSteps`), Task 2 (`detail` option), Task 3 (`{ close }`).
- Per page:
  - Create `chrome` **before** the first `render()`, with `chartHead: doc.querySelector('.chart-head')`.
  - Every `renderMarketChart` call passes `detail: chrome.getDetail()`.
  - `onDetailChange` runs `explainers.close(); render();`.
  - Keep `const explainers = attachRegionExplainers(chart)`. Since `onDetailChange` can't fire before init finishes, a `let explainers` assigned after the first render is fine.
  - After `render()`, call `maybeAutoStartTour(chrome)`.
- Tour params: ceiling `{ policyName: 'price ceiling', sliderNoun: 'ceiling' }`; floor `{ 'price floor', 'floor' }`; tax `{ 'tax', 'tax' }`; subsidy `{ 'subsidy', 'subsidy' }`. All have `clickableRegions: true`. Thread them through `initPriceControlPage`'s options as `tour: { policyName, sliderNoun }`.

- [ ] **Step 1: Write failing tests.** In each `*.integration.test.js` (real markup), add `localStorage.clear()` in `beforeEach` and these cases:
  - After init, `.chart-head .detail-gear` and `.tour-replay` exist, and a `.tour-bubble` is present with `Step 1 of 4`.
  - Review Focus 4: set `localStorage econ.detail = 'ib'` before init. Turn the intervention toggle on and dispatch `change`, then drag a slider (set the value and dispatch `input`) → `#chart` still has `data-detail="ib"` and zero `.region-badge`.
  - Review Focus 2 (ceiling file only): at Full, click `[data-region="cs"]` → a popover exists. Then pick `clean` in the gear → no `.region-popover`.
- [ ] **Step 2:** Run `npm run test`. Expected: new tests FAIL.
- [ ] **Step 3:** Wire the pages as described.
- [ ] **Step 4:** Run `npm run test`. Expected: full suite PASS.
- [ ] **Step 5:** Commit: `git add src/pages && git commit -m "feat(government-intervention): detail settings and first-visit walkthrough on all four pages"`

---

### Task 8: Docs + manual verification

**Files:**
- Modify: `CLAUDE.md` ("Definition of done" list): add one bullet covering the requirement that every graph page calls `initGraphChrome` with its own steps and passes `detail: chrome.getDetail()` to its renderer. The bullet should say that a new renderer must honour the `full|clean|ib` contract, link the new spec, and note the bottom-left replay button and the "tour says what you can do, never what it teaches" rule.
- Modify: `docs/superpowers/specs/2026-09-24-ib-econ-graph-site-design.md`: add a short "Onboarding + detail settings" section pointing to the new spec.

- [ ] **Step 1:** Make both doc edits.
- [ ] **Step 2:** Run `npm run build`. Expected: build succeeds with no errors.
- [ ] **Step 3:** Run `npm run dev` and open each of the 4 pages in a fresh browser profile, or after clearing localStorage. Check:
  - The tour auto-runs on the first page only.
  - Replay works.
  - The gear switches all 3 levels with the chart updating.
  - IB perfect shows no numbers or chips, and names areas.
  - `?detail=ib` works.
  - At 375px width, the tour bubble stays on screen and scrolls to each target.
  - Dark mode looks right.
- [ ] **Step 4:** Commit: `git add CLAUDE.md docs/superpowers/specs/2026-09-24-ib-econ-graph-site-design.md && git commit -m "docs: record onboarding + detail-settings rules"`

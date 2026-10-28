# Handoff: bring the subsidy's Explain/Play rework to the Indirect tax page

Written 2026-10-28, at the end of the session that built the subsidy rework. Read this first in a fresh session, then the files it points to.

## Where things stand

- Branch `development`, pushed to origin at `941d684`. **Never push to `main`.** The owner merges to main themselves.
- The subsidy page is the finished pilot. It has Explain/Play modes, IB perfect and Explorer views, marginal CS/PS shading, and an axis that reads Qe / Q<sub>subsidy</sub>.
  - Spec: `docs/superpowers/specs/2026-10-27-subsidy-explain-and-play-design.md` (the "why" for every choice).
  - Plan: `docs/superpowers/plans/2026-10-27-subsidy-explain-and-play.md` (how it was built, in 12 tasks).
- Ms. Patel's feedback, with its status, is in `docs/teacher-feedback.md`. Request 2 (tax quantity axis) is the tax page's own open item.
- Run tests with `npx vitest run --exclude '.claude/**'` (408 pass, 1 skipped). Without the exclude, stale `.claude/worktrees` copies get collected too.

## What the owner wants next

"Similar changes to the taxes graph": the same Explain/Play treatment on `units/microeconomics/government-intervention/indirect-tax.html` (`src/pages/indirect-tax.js`). This needs a short brainstorm with the owner before planning. The subsidy took one, and several tax answers are not obvious (see the questions below). Follow the same flow as last time: brainstorm, spec, plan, then subagent-driven execution.

## What carries over unchanged (reuse it, don't rebuild it)

| Piece | File | Notes |
|---|---|---|
| Step card | `src/components/explainCard.js` | Generic except the slider's `aria-label` ('Subsidy per loaf'). Make it an option. |
| Explain/Play switch | `src/components/modeSwitch.js` | Generic. |
| IB perfect / Explorer switch + focus bar | `src/components/viewSwitch.js` | Check its focus list. The tax foci differ (below). |
| Split Explain/Play tile | `src/components/tileSplit.js`, `diagramModeLinks` in `src/lib/units.js` | Turned on per diagram by `modes: ['explain', 'play']` in `units.js`. Add it to the `indirect-tax` entry. |
| URL state | `src/lib/pageMode.js` | Generic, apart from the comments, and `FOCUS_IDS` (below). |
| Layered renderer | `src/lib/marketChart.js` (`LAYERS`, `resolveLayers`, options `layers`/`captions`/`enter`/`grow`/`focus`/`areaLabels`) | Any new mark must belong to a layer. |
| Tour without the gear | `initGraphChrome(..., { detailSettings: false })` + `interventionTourSteps({ viewSwitch: true })` | Tour auto-runs only in Play. |
| Page wiring to copy | `src/pages/subsidy.js` (226 lines) + `subsidyExplainSteps.js` | The template for the new `indirect-tax.js` and an `indirectTaxExplainSteps.js`. |

## Subsidy-only hardcodes the tax port has to generalise

All of these are in `src/lib/marketChart.js` unless noted:

- `FOCUS_IDS = ['cs','ps','overlap','gov','dwl']` and `focusSpec()`.
  - Tax has no overlap. Its government area is **tax revenue** (`data-region="tax-revenue"`), not `subsidy-cost`.
  - The likely tax foci are cs / ps / revenue / dwl. They may also include the consumer and producer burden bands (`taxWedges`). Ask the owner.
- `resolveLayers()`: the `ibSubsidy` branch (csTriangle/psTriangle/marginalCs/marginalPs) is subsidy-only. The tax IB perfect picture needs its own decision (below).
- The x-axis symbol is chosen in `axisSymbols()` by `result.mode === 'subsidy' ? 'subsidy' : '1'`.
- **Axis-label trap.** The x-axis loop anchors any word subscript (`sub.length > 2`) at `start`, so the word trails **right**. That suits Q<sub>subsidy</sub>, which is always right of Qe. Q<sub>tax</sub> is always **left** of Qe, so the same rule would run "tax" into Qe at small taxes.
  - Fix: give a left-of-ref word symbol `text-anchor: end`, so the word sits to the left of its line. Then screenshot at a small tax (about $3–8) and at the default.
- `regionExplainers.js` has subsidy-specific CS/PS "before the subsidy" and marginal entries. Tax needs its own copy.
- `pageMode.js` / CLAUDE.md say "the subsidy page". Make the wording generic once two pages use it.

## Tax-specific things the subsidy never had

- **Specific vs ad valorem.** This is a radio mode toggle on the same page (CLAUDE.md rule). Ad valorem pivots supply instead of shifting it in parallel.
  - Does Explain teach specific only, or both?
  - Does Play keep the radios in both views?
- **A tax big enough to close the market** (`result.closed`). Explain's live slider and Explorer must handle "no trade" (`NO_TRADE_NOTE`, `hasOpenWedge`).
- **The existing incidence bands** (`taxWedges`: consumer burden / producer burden) and the revenue box. Decide how these map onto the IB perfect and Explorer views.

## Questions to ask the owner in the brainstorm (most important first)

1. **Tax quantity labels (Ms. Patel request 2).** Her wording was "Q1 and Q tax", relayed verbally. By the subsidy precedent (Qe + Q<sub>subsidy</sub>), the guess is **Qe + Q<sub>tax</sub>**. Confirm before changing. The feedback log also asks for an audit of every page's quantity axis against the IB convention.
2. **The IB perfect tax picture.** Which areas are shaded? The likely set is post-tax CS, post-tax PS, the revenue box and DWL. Are the revenue box's consumer/producer burden halves split by colour, or shown as one box?
3. **Explain's teaching frame.** The subsidy used a bakery, and S1 never moves. Pick a story for the tax (e.g. a sugar tax on soft drinks) and decide what the "aha" step is. The subsidy's was "S1 stays put; S2 is the supply curve once the subsidy is paid".
4. **Explorer foci for tax**, and whether they include the burden bands.
5. **Specific / ad valorem scope** in Explain (see above).
6. **Area-label setting.** The subsidy has `SUBSIDY_AREA_LABELS` (full/half/none) pending Ms. Patel's request 3. Should the tax page share one constant or have its own?

## Still open from the subsidy (don't resolve silently)

- `SUBSIDY_AREA_LABELS` value: waiting on Ms. Patel.
- Request 3 scope: do the price-control pages drop the CS/PS names too?
- Request 4: does the gov box now read clearly? Waiting on Ms. Patel.
- Explain-step animation polish and the step-9 picture reset: the owner deferred both.

## Kick-off prompt for the next session

> Read `docs/superpowers/handoff-2026-10-28-tax-explain-and-play.md`, then let's brainstorm the Explain/Play rework for the Indirect tax page, the same way we did the subsidy.

# Elasticity family — design

Status: approved in conversation 2026-10-05, pending written-spec review. Extends `2026-09-24-ib-econ-graph-site-design.md`; if the two diverge on the Elasticity family, this file is more recent.

## Intent

The user (IB Economics teacher, G11 class) wants the Elasticity family built next. Elasticity is already taught, so this is a revision/backfill tool. It must meet the same interactivity bar as the Government Intervention pages: moving a control live-updates the relevant marks and numbers, never a static annotated image. It is for conceptual understanding, not calculation drills.

Note on ordering: `CLAUDE.md` puts Market Failure before the Demand & Supply / Elasticity backfill. The user chose to do Elasticity next; this is their call, not an oversight.

The user asked for **two modes of explanation**: an intuitive one (how elasticity at the equilibrium changes as curve slope changes) and a straight-line explainer (how elasticity changes *along* a straight demand or supply curve), the latter marked **HL**. This matches the existing spec note that SL does not cover elasticity varying along a linear curve.

## Pages

All under `units/microeconomics/elasticity/`. Family page: `units/microeconomics/elasticity.html`.

| Slug | Title | Level | Renderer | Star interaction |
|---|---|---|---|---|
| `slope-and-elasticity` | Slope & elasticity at equilibrium | SL | `marketChart.js` (free-market mode) | "Shock" control shifting supply or demand, with a ghost of the old curves |
| `straight-line-elasticity` | Elasticity along a straight line | **HL** | `elasticityChart.js` | Price slider (demand mode) / intercept slider (supply mode) |
| `ped-total-revenue` | PED & total revenue | SL | `elasticityChart.js` | Price slider + ±10% price-change comparison |
| `yed-xed` | Income & cross elasticity | SL | TBD | Coming soon (WIP stub); out of scope for this spec |

Build order: `slope-and-elasticity` → `straight-line-elasticity` → `ped-total-revenue`. The first is mostly reuse and resolves the "Why? →" links.

Taxonomy change in `src/lib/units.js` (and `units.test.js`, search index): replace the placeholder `ped` and `pes` diagrams with the three slugs above; keep `yed-xed` as coming-soon. Each page flips from `coming-soon` to `built` only when it ships. The family status moves to `built` once at least one page ships (confirm against how `units.js` models partial families, e.g. Government Intervention).

### Slope & elasticity at equilibrium (SL)

- Free-market diagram with CS/PS shading. No intervention toggle, because there is no policy; the shock control is the star instead. (Documented exception to the intervention-toggle rule.)
- Controls follow the existing slider model (spec, "Slider model"): shift sliders are signed offsets; elasticity sliders are right = flatter, pivoting through the equilibrium; wire via `readCurveParams()` + `wireShiftAndSlopeInputs()`; `guardSliders()`/`fitsChart()` stop at the chart edge.
- Shock control: shifts supply (or demand) and draws a ghost of the old curve, with ΔP and ΔQ marked on the axes. The lesson: inelastic demand means a supply shift moves price a lot and quantity little; elastic is the reverse. The shock animates via `tweenValue` over ~400ms, driving the same `computeMarket` call as the rest of the page.
- Readouts are true point elasticities from `pointElasticities()`, never derived from slope. No hint text under sliders. The existing `.panel-disclaimer` with its "Why? →" link is required, pointing to `straight-line-elasticity`.
- Default is unit elastic at equilibrium (`UNIT_ELASTIC_SLOPE`).

### Elasticity along a straight line (HL)

- Mode toggle (radio, no "off" state): **Demand** | **Supply**. Same axes, curve differs by parameter, so one page per the toggle-vs-page rule.
- Both modes are **fixed-slope**, so a student cannot take away "steeper = less elastic".
- **Demand mode:** price slider moves a point along the curve. Upper half tinted elastic, lower half inelastic, unit-elastic marker at the midpoint. Readout shows PED = (1/slope) × P/Q so the changing P/Q term is visible.
- **Supply mode:** intercept slider moves the curve through the three IB cases (cuts quantity axis: PES < 1; through origin: PES = 1; cuts price axis: PES > 1). PES readout live; along any such line PES tends toward 1 at larger quantities.
- Zone/region colours reuse the existing `--demand` / `--supply` tokens; no new colours.
- HL pill on the tile and the page.

### PED & total revenue (SL)

- One straight demand curve, draggable point P1/Q1, total revenue rectangle (P × Q) as the focal shaded region, faint ghost of previous TR while dragging.
- "Price change" row: second point P2 at ±10% of P1; shows %ΔP, %ΔQd, resulting PED, TR before/after, and ΔTR. ΔTR is green when a price rise raises revenue and red when it lowers it.
- Demand position (shift) and slope sliders per the slider model.
- No intervention toggle (no policy).

## Architecture

**Approach chosen: a new `elasticityChart.js` renderer plus a pure `elasticityEngine.js`.** Rejected: extending `marketChart.js` (already 748 lines and market-specific; most of its regions don't apply to single-curve, point-based charts) and embedding elasticity in the intervention pages (the spec already rejects mega-pages).

- `src/lib/elasticityEngine.js`: pure maths with no DOM. Point elasticity along a line, PES by intercept case, total revenue, midpoint/zone boundaries. Colocated `elasticityEngine.test.js`.
- `src/lib/elasticityChart.js`: SVG renderer. Reuses real-pixel viewBox sizing (1 unit = 1 CSS px, redraw on resize) and the fixed type scale from `marketChart.js` (13px ticks/labels, 14px curve names, 16px axis symbols). Give new chart labels their own classes; never reuse `.tick-label`. Extract shared helpers from `marketChart.js` only where reuse is real.
- Per page: `src/pages/<slug>.js` (testable logic), `<slug>-entry.js` (Vite entry), `<slug>.test.js`, `<slug>.integration.test.js`; register the HTML under `build.rollupOptions.input` in `vite.config.js`.
- Header nav: `getFamilyNav(currentSlug, { familySlug: 'elasticity' })` → `renderMiniHeader(...)`; no hand-rolled sibling nav.
- Layout: two-column; `.main-col` holds chart + "Market outcome" stat panel, `.sidebar` holds controls only; columns end at the same bottom edge (last panel `flex: 1`). Last sidebar panel is "Real world examples".
- Unit accent: reuse the Microeconomics accent token. Body class follows the existing `theme-<family>` pattern.

## Per-page definition of done (from CLAUDE.md, applied)

- Live-updating regions/readouts in distinct colours.
- SL/HL tag on the tile and the page.
- Linked from the family page; indexed by homepage search (tags e.g. `ped`, `pes`, `elastic`, `inelastic`, `total revenue`, `slope`).
- Feedback form embedded per the existing pattern.
- Real-world examples: ~3 links found via an actual web search (never constructed URLs), at least one non-Western, free sources preferred, `target="_blank" rel="noopener noreferrer"`. Cards fill the panel with the categorical colour treatment (purple variant toned down).
- Check against the spec's "Known failure modes" before shipping; elasticity readouts must be true point elasticity.
- Cross-links: the "Why? →" links on the four Government Intervention pages (`elasticityInfoHref()` in `pageControls.js`) retarget to `straight-line-elasticity` once it exists, instead of the WIP stub.

## Open items (not decided here)

- Whether `yed-xed` needs a new chart type (Engel curve, cross-elasticity); deferred, stays a WIP-stub tile.
- Exact IB syllabus placement of the PED/total-revenue relationship (SL vs HL) should be verified against the IB Economics guide before the page's level pill is final; the user's stated intent is SL.
- Real-world example sources for each page, to be found by web search at build time.

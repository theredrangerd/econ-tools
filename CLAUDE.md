# IB Economics Interactive Graph Site — context for AI coding agents

Read this before making design or architectural decisions in this repo. The full design record, including rejected alternatives and rationale, lives in `docs/superpowers/specs/2026-09-24-ib-econ-graph-site-design.md` — read that file too before resuming non-trivial design/implementation work; treat it as more authoritative than this summary if they ever diverge, and update both if a decision here changes.

## Mission and audience

This repo is expanding from a single prototype page (`equilibrium-lab.html`, being retired once its content is ported) into a full site of interactive, animated IB Economics graph explorers. The user is an IB Economics teacher building this primarily for their own G11 class, with informal sharing to other teachers/students as a bonus, not a requirement.

**The problem being solved:** hand-drawn graphs collapse into an illegible mess once a teacher annotates multiple relationships on top of the base curves (e.g. a price control, then consumer surplus, producer surplus, and deadweight loss, all in one color). **The bet:** interactivity (not animation alone) — a student dragging a control and watching shaded regions update live in distinct colors — is what makes cause (intervention) → effect (welfare change) click. This is **not** exam hand-drawing practice; it's for conceptual understanding.

Two arrival patterns that must both work:
1. **Deep link to one specific graph** (dominant pattern) — a teacher shares a link to exactly one scenario, in-class or for revision.
2. **Cold browse/revision** — a student who doesn't know the taxonomy uses homepage search or unit/family browsing.

This split is *why* the architecture below looks the way it does — don't propose a "unified mega-page with toggles" design; it was explicitly considered and rejected (see spec, "Information architecture: engine vs. pages").

## Architecture: shared engine + focused pages

- **One shared rendering engine** (curves, shading, labels, animation) built once as a plain JS module, imported by every graph page.
- **Separate, focused page per teaching scenario** (Price Ceiling, Price Floor, Tax, Subsidy, Labor Market, etc.), each independently deep-linkable, each showing only the controls relevant to that scenario.
- Pages within a topic are cross-linked as a "family" so a student can hop Price Ceiling → Price Floor → Tax without losing context.
- **Rule for toggle vs. separate page:** if two variants share axes/curve shapes and differ only by parameter (specific vs. ad valorem tax; externality before/after Pigouvian tax; regulated vs. unregulated natural monopoly) → one page, mode toggle. If curve/region shapes genuinely differ (price ceiling vs. price floor; perfect competition vs. monopoly) → separate pages. Apply case-by-case as each family is built, not as an exhaustive upfront classification.

## Site structure and routing

- Multi-page mode, no client-side router: every page is a real `.html` file (`index.html`, `units/microeconomics.html`, `units/microeconomics/<family>.html`, `units/microeconomics/<family>/<diagram>.html`, ...). This is deliberate — it suits GitHub Pages hosting and keeps deep-linking trivial.
- Nesting for a unit with many diagrams (Microeconomics has ~40): unit page (one tile per topic family) → family page (one tile per diagram) → diagram page (the actual interactive graph, and the deep-link target). Search on the homepage resolves directly to a diagram page regardless of nesting depth, so the extra navigation layer doesn't hurt the "share one link" use case.
- **Three-tier WIP fallback:** any tile — unit, family, or diagram — that isn't built yet links to the shared generic "Work in Progress" stub page (`units/wip.html`, driven by `src/pages/wip.js`), which embeds a Google Form for feedback. Never leave a dead link or silently omit an unbuilt item; always route through the WIP stub. The WIP stub is intentionally generic/shared, not per-unit.
- Homepage unit tiles use a **bento grid with fixed, tiered sizes** — Microeconomics = large, Macroeconomics = medium, International = small, Development = small — configured as a static value, not computed from live graph count. Do not "fix" this to be computed dynamically; that was explicitly rejected (it would make small-but-complete units shrink to unclickable slivers and cause layout reflow on every release). If the assumed content-volume ratio ever proves wrong, it's a one-line config change, not a redesign.
- Coming-soon units/families stay **visible** on the site (not hidden), consistent with the principle that the site should be honest about current completeness.

## Codebase layout

- `index.html` — homepage entry.
- `units/wip.html` — generic Work-in-Progress stub page (embeds the feedback Google Form).
- `src/pages/` — per-page logic (`home.js` + `home-entry.js`, `wip.js` + `wip-entry.js`); `*-entry.js` files are the Vite build entry points, `*.js` (no `-entry`) hold the testable logic.
- `src/components/` — shared UI pieces: `chrome.js` (injects shared header/nav/hero markup into every page at load time), `bento.js` (the homepage unit grid), `search.js` (homepage search).
- `src/lib/units.js` — unit/family/diagram data model (syllabus taxonomy, tier config, build status).
- `src/styles/tokens.css` — shared design tokens (colors/fonts), carried over from `equilibrium-lab.html`'s original `:root` variables; `src/styles/pages.css` — shared page-level styles.
- `vite.config.js` — multi-page build config; each real page must be registered under `build.rollupOptions.input` (see `main`/`wip` entries) or Vite won't emit it.
- Tests are colocated (`*.test.js` next to the file it tests) using Vitest + jsdom; run with `npm run test`.

## Per-unit visual identity

Each syllabus unit gets an accent color token (e.g. `--unit-microeconomics: var(--demand)` for Microeconomics, currently blue) used on its homepage tile *and* carried through as the accent (header underline, hairlines, hover/active states — not a full background wash) on that unit's pages and family sub-pages. When adding a new unit or family page, apply the existing unit accent token rather than introducing new ad hoc unit colors.

## Microeconomics build order (current priority)

Follows the user's actual teaching calendar, not exam weighting — do not resequence based on assumed exam importance:

1. **Government Intervention** — current top priority. Price ceiling and price floor already exist (`equilibrium-lab.html`) and need porting into the new per-diagram template; indirect tax (specific + ad valorem, one page with a mode toggle) and subsidy are next.
2. **Market Failure** — next per syllabus order (negative/positive production/consumption externalities, Pigouvian tax toggle, carbon trading, public goods — scope on some of these is tentative).
3. **Demand & Supply / Elasticity backfill** — already taught, lower urgency.
4. **Theory of the Firm (HL only)** — later in the school year; needs its own visually distinct, HL-badged block on the Microeconomics unit page, and every diagram/tile in this family needs an explicit SL/HL pill.

`equilibrium-lab.html` is retired outright (no redirect) once price ceiling/floor are ported to the new template.

**Full diagram inventory per family** (working baseline, corrected against ibonomics.org — theibtrainer.com's list could not be retrieved for cross-check) is in the spec doc's "Diagram inventory" section — check there before assuming a diagram belongs to a given family, since one correction already happened (Lorenz curve/Gini moved out of Microeconomics to a later Macro/Development roadmap; Consumer & Producer Surplus and Allocative Efficiency were added as standalone diagrams).

## Definition of "done" for a new graph page

- Interactivity matches the price-ceiling/DWL quality bar: moving a control live-updates the relevant regions (surplus, DWL, tax revenue, etc.) in distinct colors — never a static annotated image.
- **Any overlaid policy intervention gets an explicit on/off toggle, defaulting to off.** Price ceiling, price floor, indirect tax, and subsidy all use the same `.switch` control to impose/remove the intervention on top of the free-market baseline — this is a rule for every future graph, not a per-page choice. Parameter sliders (ceiling price, tax rate, subsidy amount, ...) stay visible and live regardless of toggle state; only whether the intervention reaches `computeMarket` (vs. `{ type: 'none' }`) depends on the toggle. This does *not* apply to mode toggles with no "off" state (e.g. specific vs. ad valorem once a tax is already on) — those stay as radio-button mode switches. See spec doc, "Intervention on/off toggle" for full rationale.
- SL/HL tag visible on both the diagram page and its tile.
- Linked from its family page and indexed by homepage search.
- Embeds the site's feedback form per the existing pattern.
- **Header nav is a single `#mini-header` row, never a second nav element.** Wire it via `getFamilyNav(currentSlug, { familySlug })` (in `familyNav.js`) → `renderMiniHeader({ title, backHref, backLabel, siblings })` (in `chrome.js`). This renders, in order: back-to-family link → home link → current title → sibling pill-chip links to every *other* diagram in the family. Don't hand-roll a separate sibling-nav container per page — an earlier version did this and produced a duplicate, redundant back link. See spec doc, "Diagram-page header nav" for the full rationale and the `.mini-header__siblings` pill styling (uses the generic `--accent`/`--accent-fill` token pair, not a hardcoded color).
- **Two-column layout: `.main-col` (left) holds the chart card + "Market outcome" panel stacked together; `.sidebar` (right) holds only controls** — intervention panel first (toggle + its own parameters), then "Shift the curves" (demand/supply position sliders), then "Elasticity" (slope sliders only) last. Results live on the left so a student never looks away from the chart+numbers to read an outcome; controls live on the right, kept visually compact (`.sidebar .panel`/`.sidebar .slider-row` use tighter spacing than the general `.panel`/`.slider-row` rules) so the three control panels come close to matching the chart's height. No reset-to-defaults button — it was removed sitewide along with the `DEFAULTS` JS object that backed it; don't add one back without a concrete reason. See spec doc, "Two-column layout: controls column vs. results column".
- **The intervention toggle is visually the star of the page**, not a plain checkbox: apply the `.toggle-row--primary` modifier class to the "Impose ___" row (bigger switch, bolder label, tinted/bordered callout box) on every future intervention panel. Every other toggle-row (mode-select radios, etc.) stays default size. See spec doc, "Intervention on/off toggle".
- **No explanatory hint text under the elasticity sliders** (no `.slider-hint` paragraphs like "Flatter = buyers react strongly..."). The numeric elasticity label (e.g. "1.0 · unit elastic") is fine since it's feedback from the student's own action; a written explanation defeats the "learn by playing" goal — a student should discover what a flatter/steeper curve means by dragging the slider, not read it first. This applies to every future graph page with elasticity controls, not just the four existing Government Intervention pages.

## Open decisions — do not silently resolve these

These are explicitly deferred, not oversights. Flag them to the user rather than picking a default:
- Individual graph page template's exact layout details beyond the structural approach above (expected to be finalized while building the first tax page, not abstractly beforehand).
- Analytics tool choice (candidates discussed: Plausible, self-hosted Umami, GoatCounter) — needed before real launch; return engagement is the primary success metric, so this matters, but it doesn't block building pages now.
- GitHub Pages deploy workflow (base path config, GitHub Actions) — needed before the site is live, not before local build/preview.
- Macroeconomics / International / Development roadmaps — same exercise as Microeconomics' roadmap, deliberately deferred until Microeconomics is underway.

## Known environment gap

This environment has previously lacked `git@github.com` SSH push access (publickey denied). Verify push access works before assuming a commit reached `origin/main`; if push fails, say so rather than reporting the change as shipped.

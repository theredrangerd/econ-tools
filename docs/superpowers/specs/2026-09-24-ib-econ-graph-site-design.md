# IB Economics Interactive Graph Site — Design

Status: homepage fully specified, ready to build. Unit subpage structure and individual graph page specs not yet designed.

## Mission

Build a general-purpose site of interactive, animated economics graph explorers for IB Economics, evolving beyond the current single-page `equilibrium-lab.html` prototype.

**The problem:** hand-drawn graphs (as typically taught in class) collapse into an illegible mess once a teacher starts annotating relationships — e.g. a minimum price on a demerit good, then consumer surplus, producer surplus, and deadweight loss on top, often all in the same color/pen. It's hard for a teacher to present clearly and hard for students to disentangle afterward.

**The bet:** it's not animation/motion itself that teaches — it's *interactivity*. Letting a student move a price control and watch the surplus regions and DWL update live, in distinct colors, is what makes the relationship between cause (the intervention) and effect (the welfare change) click. Equilibrium Lab's price-ceiling/DWL demo is the existing proof of this and the quality bar for everything that follows.

**Not the goal:** exam hand-drawing practice. This is for *understanding*, not for replacing the hand-drawn-diagram skill IB exams actually test.

## Audience & primary usage pattern

Primary audience: IB Economics students (and their teachers) at the user's school and, ideally, beyond it. The site is self-hosted independently of the school (for regulatory simplicity), with informal teacher buy-in/sharing rather than official school affiliation.

Two real arrival patterns, both must work well:
1. **Deep link during/after a specific lesson** — a teacher shares a link to *one* graph (e.g. "price floor on cigarettes") either as an in-class 5-minute interactive activity or as a revision resource mentioned in passing ("if you need a reminder of what this graph does, here's the site"). This is the dominant pattern and drove the "focused pages, not one mega-toggle page" decision below.
2. **Cold browse/revision** — a student vaguely remembers a concept but not which page it's on, and needs to find it via the homepage's structure or search.

## Scope strategy

Small number of graphs, done extremely well, near-term — full IB syllabus coverage is the long-term North Star, not a launch requirement. Checked existing tools (Geogebra IB econ resources, Desmos economics activities, tutor2u, etc.) and found none with genuinely good interactivity/UX — real gap, not reinventing something that already works well.

## Success / failure signal

Primary success metric: **return engagement** (repeat visits, time spent) as a proxy for whether the tool is actually useful versus a one-time novelty. Site analytics is a real launch requirement, not a nice-to-have. Failure would look like low return visits / students still avoiding graph questions despite the tool existing.

## Information architecture: engine vs. pages

Considered a single "mega page" per topic family (e.g. one Supply & Demand page with toggles for price ceiling/floor/tax/subsidy/labor-market/surplus/DWL). Rejected in favor of:

- **One shared, well-engineered rendering engine** (curves, shading, labels, animation) built once, reused everywhere as an internal component/module.
- **Separate, focused pages per teaching scenario** (Price Ceiling, Price Floor, Tax, Subsidy, Labor Market as its own page given its different axes/labels, etc.), each individually deep-linkable, each defaulting to only the controls relevant to that scenario.
- Pages within a topic are tied together as a "family" (e.g. via related-page navigation) so a curious student can hop between Price Ceiling → Price Floor → Tax without losing the connection between them.

Rationale: the dominant usage pattern is a single shared link to one specific scenario — a mega-page with many toggles works against clean deep-linking and front-loads cognitive complexity for a first-time visitor. Labor market and tariff diagrams also have genuinely different axes/structure (Wage/Qty-of-labor; world-price line + domestic/foreign split), not just a checkbox difference on vanilla supply and demand.

## Navigation & discovery

- Graphs are organized by **official IB syllabus units**: Microeconomics, Macroeconomics, International Economics, Development Economics. Within each unit, graphs are grouped into topic families (e.g. Supply & Demand family within Micro: price ceiling, price floor, tax, subsidy, labor market).
- **Search** is required on the homepage: a student who half-remembers a concept ("the triangle graph," "minimum wage thing") without knowing the syllabus taxonomy should be able to find the right page without browsing the full hierarchy.
- Rough distinct-diagram counts per unit, pulled from IB econ diagram guides ([ibonomics.org](https://www.ibonomics.org/ib-economics-diagrams), [theibtrainer.com](https://www.theibtrainer.com/ib-economics-required-diagrams)): **Microeconomics ~40**, **Macroeconomics ~18**, **International ~6**, **Development ~4**. This is a real, permanent skew (not something that evens out later) — Microeconomics will always dominate in content volume.

## Homepage design (agreed)

- **Hero**: centered, similar visual treatment to Equilibrium Lab's current header (eyebrow tag, serif h1, muted lede) but larger, since this page introduces the whole site rather than one tool.
- **Search bar**: directly below the hero, prominent, with placeholder copy communicating "type any graph you want" (e.g. "minimum wage," "deadweight loss").
- **Unit browsing**: a **bento-style grid** of four tiles (Micro / Macro / International / Development), asymmetric sizing to reflect real content volume differences — this was chosen over a uniform grid and an editorial table-of-contents list after visual comparison.
  - **Sizing approach**: **tiered, fixed, not computed from live count.** Three size bands, assigned once as a config value based on known syllabus scale: **Microeconomics = large, Macroeconomics = medium, International = small, Development = small.** This is a static setting (not recalculated from how many graphs happen to be live), so there's no threshold logic to build and no reflow risk as graphs are added — if the assumed distribution ever proves wrong, it's a one-line config change.
  - Rejected literal proportional-to-live-count sizing: at real syllabus scale it makes International/Development shrink to near-unclickable slivers that stay that small even once those units are "complete" (they just have few distinct diagrams by nature), and it would cause the whole grid to visually reflow on every single graph release.
- **Clicking a unit tile navigates** to a per-unit subpage (not an in-place expand). Until each unit's real subpage is built, its tile links to a shared **generic "Work in Progress" stub page** containing the embedded feedback form (see Feedback mechanism below) — all four units start on this stub and get swapped to a real subpage one at a time as they're built.
- **"Coming soon" units** (International, Development at launch) are visible on the homepage, not hidden or omitted, consistent with the general principle that the homepage should be honest about current completeness rather than overpromising.

## Feedback mechanism (agreed)

- Every unit subpage — not just "coming soon" ones — embeds a **Google Form** for feedback / requests (new graphs, features). Barrier to giving feedback should be as low as possible (embedded inline, not a separate off-site link/click-through).
- Form (user-created): `https://docs.google.com/forms/d/e/1FAIpQLSc4hUwcytl1QE3H1Iod7Ag8SRmmgDdEAPJED37kbj-ZB2O7yQ/viewform?usp=publish-editor` — embedded via `<iframe>` on the generic Work-in-Progress stub page (see Homepage design above) and, later, on every real unit subpage.

## Technical stack (agreed)

- **Vite + vanilla JS/TS, no UI framework** (not React/Vue/Svelte/etc.) — chosen over pure static HTML/CSS/JS for component reuse (shared nav/header/layout across many pages, avoiding copy-paste drift) and a build-time-generated search index, while staying close to static output performance/simplicity (no virtual DOM, no hydration cost).
- **Multi-page mode**: each page is a real `.html` file (`index.html`, `units/microeconomics.html`, etc. — no client-side router), which suits GitHub Pages and keeps deep-linking trivial.
- **Shared chrome**: a small JS module (`src/components/chrome.js`) injects header/nav/hero markup into each page at load time, plus one shared stylesheet holding the design tokens (colors/fonts, carried over from Equilibrium Lab's `:root` variables) so every page stays visually consistent without copy-pasting CSS/HTML across files.
- **Hosting: GitHub Pages**, self-hosted independently of the school (not on school infrastructure/domain), with informal teacher coordination for link-sharing.
- Shared rendering engine (the actual curve/shading/animation logic) is a plain JS module imported by every graph page — this part is unaffected by the static-vs-framework choice.
- Analytics: not yet chosen (candidates discussed generically: Plausible, self-hosted Umami, GoatCounter, or GitHub Pages-compatible options) — needs a decision before launch since it's the primary success metric instrument, but doesn't block building the homepage.

## Microeconomics roadmap (agreed)

Scope decision: full ~40-diagram coverage is the long-term goal, not the launch bar. Ship a curated subset first, sequenced to match the user's actual G11 teaching calendar, with the full diagram list mapped out now so later releases have a clear slot to land in.

### Unit page structure

Rejected a single flat/sectioned Microeconomics page (too much content at ~40 diagrams) in favor of **nested family sub-pages**: `units/microeconomics.html` (unit page, one tile per topic family) → `units/microeconomics/<family>.html` (family page, one tile per diagram) → `units/microeconomics/<family>/<diagram>.html` (the actual interactive graph — the deep-link target). This adds a navigation layer versus a flat page, accepted because the homepage search already covers the "I don't want to click through three levels" case — search resolves straight to the diagram page regardless of nesting depth, and a teacher's shared link always points directly at a diagram page, never through the family/unit layers.

**Three-tier WIP fallback**, extending the homepage's existing stub pattern: an unbuilt family's tile on the unit page links to the generic WIP stub, same as today's unbuilt units. An unbuilt diagram's tile within an already-built family page follows the same rule — link to the WIP stub, not a dead link or silent omission.

**Per-unit color identity**: the homepage's blue Microeconomics tile is currently incidental (blue comes from the `--demand` token via `tier: 'large'` styling, not from the unit itself). Formalizing this: add a unit-specific accent token (e.g. `--unit-microeconomics: var(--demand)`) used on the homepage tile regardless of tier, and carried through as the accent color (header underline, hairlines, hover/active states — not a full background wash) on the Microeconomics unit page and all its family sub-pages, establishing blue as that unit's visual identity going forward.

### Topic families (syllabus/teaching order)

1. **Demand & Supply** — already taught; lowest build priority, backfilled later.
2. **Elasticity** — already taught; backfilled alongside Demand & Supply.
3. **Government Intervention** — **current class topic, top build priority.**
4. **Market Failure** — next family after Government Intervention, per syllabus order.
5. **Theory of the Firm (HL only)** — own visually distinct, HL-badged block on the unit page; every diagram in this family and its tile also carries an explicit SL/HL pill. Built after the SL-common families since it lands later in the school year.

### Diagram inventory (locked in as working baseline; corrections happen live as each family is actually built)

Cross-checked against ibonomics.org's tagged diagram gallery (confirmed it distinguishes SL/HL explicitly); theibtrainer.com's list could not be retrieved for comparison. Two items were corrected as a result: **Lorenz curve / Gini coefficient is NOT a Microeconomics diagram** (removed — it belongs to a later Macro/Development roadmap), and **Consumer & Producer Surplus** plus **Allocative Efficiency** were added as their own foundational diagrams rather than only appearing embedded in the price ceiling/floor pages.

**2026-09-27 correction, against the official IB Economics guide (first assessment 2022) plus ibonomics.org and theibtrainer.com:** the guide's actual Government Intervention topic (2.7) contains only price ceiling, price floor, indirect tax, and subsidy — **agricultural markets/buffer stock scheme does not exist in the current syllabus** (it's a holdover from a pre-2022 version) and is cut entirely, not just deprioritized. Separately, "Theory of the Firm" doesn't match a real syllabus topic name or scope — the actual topic is **2.11 "Market failure — market power"**, and its named diagrams are narrower than assumed: **no cost curves (short/long-run), no revenue curves, no price discrimination, no kinked demand curve** — none of these are in the guide, ibonomics.org, or theibtrainer.com, so all four are cut. Two items are kept/added: **game theory payoff matrix** (the guide's 2.11 prose explicitly names "simple game theory payoff matrix" even though it isn't tagged in the formal Diagram column, and ibonomics.org lists it as its own HL diagram) and **LRAC & minimum efficient scale** (not in the guide's text, but present on ibonomics.org as an HL diagram and useful for explaining the natural-monopoly/economies-of-scale claims in that same topic).

- **Demand & Supply**: demand curve (shift vs. movement along), supply curve (shift vs. movement along), market equilibrium, consumer & producer surplus, allocative efficiency.
- **Elasticity**: PED, elasticity along a (linear) demand curve, PED & total revenue, PES, YED/Engel curve, XED (scope tentative).
- **Government Intervention**: price ceiling ✅ *(exists today as `equilibrium-lab.html`, to be ported into the new template)*, price floor ✅ *(same)*, indirect tax (specific + ad valorem as one page, mode toggle — see rule below), subsidy. Nothing else belongs in this family.
- **Market Failure**: negative production externality (+ Pigouvian tax correction as a toggle on the same page), negative consumption externality, positive production externality, positive consumption externality, carbon emissions trading/market for pollution permits, public goods & common resources (scope tentative — not confirmed in the fetched source list).
- **Theory of the Firm [HL]** *(maps to syllabus 2.11 "Market failure — market power")*: perfect competition (short-run loss, long-run equilibrium), monopoly (profit max/welfare loss, natural monopoly), monopolistic competition (short-run loss, long-run equilibrium), oligopoly (collusive oligopoly acting as a monopoly; game theory/prisoner's dilemma payoff matrix — no kinked demand curve, not in current syllabus), LRAC & minimum efficient scale.

### Build sequence

Follows the user's actual teaching calendar, not exam-weight priority: **Government Intervention now** (port price ceiling/floor into the new template; build indirect tax and subsidy pages next, since that's this week's class topic) → **Market Failure** (next, following syllabus order) → **Demand & Supply / Elasticity backfill** (already taught, lower urgency) → **Theory of the Firm [HL]** (later in the school year).

`equilibrium-lab.html` is retired outright once price ceiling/floor are ported — no redirect needed.

### Toggle vs. separate page (general rule)

When two diagram variants share the same axes and curve shapes and differ only by a parameter (e.g. specific vs. ad valorem tax; a negative externality before/after a Pigouvian tax; a natural monopoly regulated vs. unregulated) → **one page, mode toggle**. When the curve/region shapes genuinely differ (e.g. price ceiling vs. price floor; perfect competition vs. monopoly) → **separate pages**, preserving the site's original clean-deep-link principle. Applied case-by-case as each family is actually built; not an exhaustive pre-classification.

### Individual graph page template

Reuse `equilibrium-lab.html`'s existing structure (hero/eyebrow header, a controls panel of scenario-specific sliders/toggles, graph canvas) as a shared page shell that every graph page uses, importing the same shared rendering engine module (curves, shading, labels, animation) already planned in the Technical stack section above. Only the controls and parameters differ per page — this makes the "one shared engine, focused pages" decision concrete as a reusable template rather than a one-off file.

### Diagram-page header nav (general rule, decided 2026-09-27)

Every diagram page's single `#mini-header` row reads, in order: back-to-family link (`&larr; Government Intervention`) → divider → home link (`IB Econ Graphs`) → current page title → divider → pill-chip links to every *other* diagram in the family (the current page is excluded from the chip list since the title already names it). There is no second nav row — an earlier draft duplicated the back-to-family link into a separate `#family-nav` element directly above the sibling chips, which read as two competing "back" affordances stacked on top of each other; that element was removed and its data folded into `renderMiniHeader`'s `siblings` param.

The sibling chips are rendered as `.mini-header__siblings a`: rounded pill buttons (`border-radius: 999px`, `border: 1px solid var(--hairline)`, `background: var(--surface-2)`) with their own left-bordered divider, not bare inline text jammed next to the title — bare text at this density reads as smushed and undifferentiated from the title. Hover state uses `var(--accent)` for text/border and `var(--accent-fill)` for background — a new generic token pair in `tokens.css`, added specifically so this hover treatment can later pick up each unit's own accent color (see "Per-unit visual identity") without every future family reinventing the fill color.

This header structure — implemented once in `chrome.js`'s `renderMiniHeader` and `familyNav.js`'s `getFamilyNav` — is the reusable pattern for every future family, not a one-off for Government Intervention: any new family page wires up the same `getFamilyNav(currentSlug, { familySlug })` → `renderMiniHeader({ ..., siblings })` call, no bespoke nav markup per family.

### Intervention on/off toggle (general rule, decided 2026-09-27)

Any graph page that overlays a policy intervention on a free-market baseline (price ceiling, price floor, indirect tax, subsidy, and — looking ahead — Pigouvian tax, minimum wage, tariffs, etc.) **must** expose that intervention as an explicit on/off toggle switch (the same `.switch`/`.track`/`.thumb` control already used on price ceiling/floor), defaulting to **off**. The parameter sliders for the intervention (ceiling price, tax rate, subsidy amount, ...) stay visible and interactive regardless of toggle state — only whether `computeMarket` receives that intervention or `{ type: 'none' }` depends on the toggle.

Rationale: the pedagogical point of these pages is the *before → after* contrast (cause → effect). Baking the intervention into the default render (as indirect tax and subsidy originally did) skips the "before" state a student needs to see to understand what the intervention changed. This was inconsistent until 2026-09-27 — price ceiling/floor had the toggle, indirect tax/subsidy didn't — and has now been unified across all four Government Intervention pages.

This does not apply to mode toggles that pick between two flavors of the same intervention with no "off" state (e.g. specific vs. ad valorem tax type once the tax is on) — those remain radio-button mode switches, not on/off switches, and can default to whichever mode is more commonly taught.

**The intervention toggle must look like the main event, not a settings checkbox.** It's the single most important control on the page — flipping it is *the* interaction the page exists to teach — so it gets its own visual treatment via the `.toggle-row--primary` modifier class: a larger switch (`56×32` vs. the default `38×22`), bolder/larger label text, and a tinted, bordered callout box (`background: var(--accent-fill)`, `border: 1px solid var(--accent)`) around the whole row. Every other toggle-row (mode-select radios, etc.) stays at default size. Apply `toggle-row--primary` to the "Impose ___" row on every future intervention panel — don't leave it as a plain, same-size-as-everything-else toggle.

### Two-column layout: controls column vs. results column (general rule, decided 2026-09-27, revised same day)

The `.layout` grid has two columns, and each one has a fixed job — controls belong in the right column (`.sidebar`), results belong in the left column (`.main-col`):

- **Left column (`.main-col`)**: the chart card, then the **Market outcome** panel (stats grid + note) directly beneath it. Both are things the student *reads*, and stacking them together means the whole "what happened" story — graph and numbers — lives in one place, with nothing to the right competing for attention while a student is studying the result.
- **Right column (`.sidebar`)**: every *control* panel, in this fixed order, top to bottom:
  1. **The intervention panel** (whatever it's called on that page — "Price ceiling", "Indirect tax", "Subsidy", etc.) — the on/off toggle plus its own parameter slider(s)/mode controls. This is the thing the page is *about*, so it comes first, above the fold, before any curve-shifting controls.
  2. **Shift the curves** — demand/supply position sliders.
  3. **Elasticity** — demand/supply slope sliders only. No explanatory hint text under the sliders (see below).
  4. **Real world examples** (added 2026-09-27) — a short `.examples-list` of ~3 links to real, freely-readable news/reference articles giving concrete real-world instances of the policy the page models (e.g. Berlin's rent cap for price ceiling, the EU "butter mountain" for price floor, Mexico's soda tax for indirect tax, US farm subsidies for subsidy). This is the last panel in the sidebar — it's context/motivation, not a control, so it sits below the interactive controls rather than among them.

Market outcome was originally the last sidebar panel (stacked under Elasticity on the right); it was moved to the left column, under the chart, specifically so a student's eyes never have to leave the "results" side of the page to see the numeric outcome of a change, and so the controls column can be visually compact and fully visible without scrolling past a stats grid first.

**No reset button.** The "Reset to defaults" button (and the JS `DEFAULTS` object that backed it) was removed from all four Government Intervention pages — it was one more reason the controls column ran long, and it wasn't something students actually needed (they can just drag sliders back). Don't re-add a reset control to new graph pages by default; only add one back if a specific future page has a concrete reason a slider can't be easily dragged back to a sensible starting point.

**Compact control panels.** `.sidebar .panel` uses tighter padding and `.sidebar .slider-row` uses a smaller bottom margin than the general `.panel`/`.slider-row` rules (which still apply to the wider Market outcome panel in the left column), so the three control panels stay visually dense rather than padded out.

**Matched column height (decided 2026-09-27).** The two `.layout` columns must end at exactly the same bottom edge — a "mega rectangle" around the whole two-column area, not one column trailing off shorter than the other. This is done with pure CSS, no JS: `.layout` has no `align-items` override (grid's default `stretch` makes both grid items — `.main-col` and `.sidebar` — stretch to the row's height, i.e. whichever column is naturally taller), and the *last* child of each column (`.main-col > *:last-child`, `.sidebar > *:last-child` — currently the Market outcome panel and the Real world examples panel) gets `flex: 1` so it's the one that grows or shrinks to absorb the difference, rather than leaving a dead gap below a normal-height card. Whichever side is naturally shorter — usually the sidebar, since a full chart is normally taller than four compact control panels — is the one whose last panel grows; this is intentional and can flip if a future page's chart is short. Disabled below the `880px` mobile breakpoint (`flex: none`) since the columns stack into separate rows there and stretching doesn't apply.

Earlier drafts put "Shift the curves" and "Elasticity" first and the intervention panel third, which buried the actual point of the page under generic curve controls a student has to scroll past first.

**Real world examples must be genuinely verified links, never invented.** When adding this panel to a new page, find the 3 links via an actual web search and use only URLs that search results return — never construct/guess a plausible-looking URL (e.g. a Guardian tag page) by pattern-matching the site's URL structure. Prefer free, non-paywalled sources (major news orgs, public media like NPR/BBC, nonprofit data journalism like USAFacts/EWG, or even Wikipedia for a canonical textbook case like the butter mountain) over anything that requires a subscription. Each link opens in a new tab with `rel="noopener noreferrer"` since it leaves the site. Expect these links to occasionally rot (news orgs restructure URLs) — that's an acceptable, low-stakes maintenance cost, not a reason to avoid real links.

**Hard rule: at least one of the ~3 examples must be non-Western (decided 2026-09-27).** "Non-Western" means the example's *subject matter* — the country or region the policy/event took place in — is outside Europe and North America (Asia, Africa, South/Central America, Oceania all count; it's the outlet's home base that doesn't matter — an Al Jazeera or NPR story about an Asian or South American policy still counts). This exists specifically to counter the default Western-media-centric skew that search results otherwise produce — left unchecked, four independent searches will return four all-Western example sets. Concretely: price ceiling includes Argentina's rent-control repeal (Newsweek); price floor includes India's Minimum Support Price (The Tribune, India); indirect tax includes the Philippines' sin tax (Manila Bulletin); subsidy includes Indonesia's fuel-subsidy cuts (Al Jazeera). When building a new family's examples panel, check this explicitly before finalizing the 3 links — don't assume it'll happen by accident.

**Real world examples must visually fill their panel, in color, like Market outcome's stat tiles (decided 2026-09-27).** The panel (`.examples-panel`) is a flex column, and `.examples-list` + its `li`s get `flex: 1` so the 3 story cards stretch to fill whatever height the "matched column height" rule above gives the panel — never leave dead whitespace below three fixed-height cards. Each card also gets a colored background/border cycling through the same three tokens the rest of the page already uses for categorical color (`--demand-fill`/`--demand`, `--supply-fill`/`--supply`, `--gov-fill`/`--gov`, via `li:nth-child(3n+1/2/3)`), with the source label tinted to match — reusing the exact palette Market outcome's `.stat.cs`/`.stat.ps`/`.stat.gov` variants already use, not inventing new colors. This is what makes the panel "visually interesting" rather than three identical gray boxes.

The `--gov` (purple/violet) variant specifically was toned down after the first pass looked too loud next to the calmer blue/orange cards (revised same day): its background uses a light `color-mix(in srgb, var(--gov) 8%, var(--surface-2))` instead of the full-strength `--gov-fill`, its border uses a 22% mix instead of 45%, and its source label uses `color-mix(in srgb, var(--gov) 65%, var(--ink-muted))` instead of the raw token. Violet reads as more visually "loud" than blue/orange at equal opacity, so the gov variant needs a lighter touch to sit at the same perceived intensity as its siblings — don't restore it to full-strength `--gov-fill`/`--gov` if this panel (or a future one using the same 3-color cycle) is revisited.

**No elasticity hint text.** The elasticity sliders used to carry a `<p class="slider-hint">` under each one (e.g. "Flatter (left) = buyers react strongly to price..."). This was removed site-wide and must not be re-added to new graph pages: the mission is to make economics feel like *play* — a student should discover what "flatter demand = more responsive to price" means by dragging the slider and watching the chart react, not by reading it first. Only the numeric label + qualitative tag (e.g. "1.0 · unit elastic", from `elasticityLabel()`) stays, since that's feedback from the student's own action, not an explanation given in advance of it.

**No default-state narration in the `#market-note` (decided 2026-09-27).** The free-market/off-state note used to read "Equilibrium price and quantity — every mutually beneficial trade happens." on every page. Removed, and the `.note` element now hides itself entirely when empty (`.note:empty { display: none; }`) rather than showing a blank pill. This is the same "learn by playing, not by being told" principle as the elasticity-hint rule above, applied to the outcome note: the free-market baseline is the state a student starts from and returns to by toggling the intervention off, so it needs no caption telling them what they're already looking at. The other `#market-note` states (shortage/surplus quantities, DWL/welfare-loss amounts, "not binding" — all of which report a computed, state-dependent number rather than restate an obvious default) were intentionally left as-is; this rule targets the specific case of narrating the untouched baseline, not a blanket ban on all note text. If a future page's baseline note also reduces to "nothing has happened yet," follow the same pattern — empty string, not a truism.

### Definition of "done" for a graph page

- Interactivity matches the price-ceiling/DWL quality bar: moving a control live-updates the relevant regions (surplus, DWL, tax revenue, etc.) in distinct colors, not a static annotated image.
- Any overlaid policy intervention is gated behind an explicit on/off toggle defaulting to off, per the rule above — never baked into the default render.
- SL/HL tag visible on both the page and its tile.
- Linked from its family page and indexed by the homepage search.
- Feedback form accessible per the existing site-wide pattern.

## Open / not yet designed

- Individual graph page template's exact layout details beyond the structural approach above and the intervention-toggle rule now decided (sidebar panel grouping, stat-grid layout, etc.) — still fine to finalize opportunistically as new families are built rather than specified exhaustively upfront.
- Analytics tool choice — needed before real launch, not before building.
- GitHub Pages deploy workflow (base path config, GitHub Actions) — needed before the site is live, not before it's built/previewed locally.
- Macroeconomics / International / Development roadmaps — same exercise as this one, deferred until Microeconomics is underway.

# Graph onboarding walkthrough + detail settings — design

Date: 2026-10-25. Status: agreed in conversation; builder check done (calls made after it are marked *Claude's call*).

## Intent and the why

The Government Intervention pages (price ceiling, price floor, indirect tax, subsidy) need to be usable by a student **on their own**. The realistic first visit: a teacher has already taught the graph in class, then projects or shares the page and says "use this to revise, review, and tinker." The teacher (especially teachers other than the site's author) will not explain how the page works. So the page has to teach itself — but only lightly, because most of it (sliders, toggles) is intuitive. The one genuinely non-obvious thing is the **detail setting**, which is new.

The detail setting exists for two reasons:
1. Some students will find the chart chips busy and want them gone.
2. Revision value: an **IB perfect** view shows exactly what a top-mark exam diagram contains and nothing more — "this is what your exam diagram should look like."

This is not a homepage/site-intro onboarding. A proper homepage intro is explicitly deferred.

## Goals

- A short, skippable, first-visit walkthrough on graph pages.
- A per-graph-page detail setting on a scale from **Full explanation** to **IB perfect**.
- Built once, shared, so every future graph page gets both for free.

## Non-goals

- Homepage onboarding / "what is this site" intro.
- Adding *new* explanatory content. Today's chart is already the "Full explanation" end; the setting only removes things.
- Per-element on/off toggles. It's one scale with named stops, not a checklist.
- Changing the Market outcome panel or the sidebar controls by detail level — they stay identical at every level.

## Anti-goals (would be a failure even if it works)

- A walkthrough that is long, mandatory, or reappears on every graph — students will resent it.
- Walkthrough text that explains the economics or what a slider "means" (conflicts with the site's "learn by playing" rule — see CLAUDE.md, no hint text under elasticity sliders). The tour says *what you can do*, never *what it teaches*.
- An IB perfect view that contains anything a student wouldn't draw on the exam, or omits something they must.

## Walkthrough

- **When it runs:** automatically, once, the first time a visitor opens *any* graph page on the site. Never again automatically — finishing or skipping both count as "seen." Stored in `localStorage` (one site-wide flag). If storage is unavailable, fail quiet: don't show the tour automatically (better to miss it than nag on every load); the replay button still works.
- **Replay:** a small, persistent "replay tour" button fixed to the **bottom-left of the viewport** on every graph page.
- **Format:** spotlight style — page dims except the highlighted element; a small bubble beside it with "Skip tour" and "Next →" (last step: "Got it"). Short read-only pointers; the student is not required to perform the action to advance.
- **Steps (wording is a first draft, approved in spirit):**
  1. Intervention toggle (`.toggle-row--primary`) — "Turn the policy on and off. Flip this switch to impose the [policy] on the free market, and watch the graph change." Policy name per page.
  2. Sidebar sliders (intervention parameters + Shift the curves + Elasticity) — "Drag anything. These sliders move the [ceiling/tax/…], shift demand and supply, and change how steep the curves are. Everything updates live."
  3. Chart — "Tap a shaded area to see what it means and how big it is."
  4. Settings gear — "Too busy? Change the detail. This gear switches between full explanation and an IB-perfect exam diagram."
- Step 3 must be accurate for the page: if a page has no clickable regions, that step changes or drops.
- *Claude's call:* step 3 is shown only when region explainers are actually active, i.e. the page has clickable regions **and** the current detail level is Full explanation. At Clean / IB perfect (including a first visit via a `?detail=ib` deep link) it is skipped, so the tour is 3 steps. The tour does not switch the detail level.
- *Claude's call:* the tour module is generic — each page supplies its own step list (target selector + text), and the four Government Intervention pages share a helper that builds the standard four. This is required because the tour runs on the first visit to *any* graph page, including future families (e.g. Elasticity, which has no intervention toggle).
- Replay button position: fixed bottom-left of the viewport, on every graph page (user's decision).

## Detail setting

- **Placement:** a gear button on the chart card (top-right corner of the chart). Clicking opens a small popover containing a 3-stop segmented control: **Full explanation · Clean · IB perfect**, with a one-line description of IB perfect ("exactly what an exam diagram needs").
- **Persistence:** the choice is remembered site-wide (`localStorage`) and applies on every graph page.
- **Shareable:** a URL query parameter (e.g. `?detail=ib`) opens a page at a given level, so a teacher can share "the IB-perfect version." Builder's call on exact param name/values. Whether a URL-provided level also overwrites the student's saved preference is the builder's call; recommended: no (URL overrides for that view only).
- **Default for a new visitor:** Full explanation (today's chart).

### What each level shows

| Element (today's chart) | Full explanation | Clean | IB perfect |
|---|---|---|---|
| Curves, curve names (D, S, S+tax…) | ✓ | ✓ | ✓ |
| Axis titles ("Price ($ / unit)", "Quantity (units)") | ✓ | ✓ | ✓ |
| IB axis symbols (Pe, Qe, Pmax/Pmin, Qs/Qd, Pc/Pp, Q1) | ✓ | ✓ | ✓ |
| Shortage / Excess supply bracket + label | ✓ | ✓ | ✓ |
| Shaded regions (CS, PS, DWL, tax/subsidy wedges) | ✓ | ✓ | ✓ |
| Region chips (CS, PS, DWL, CB, PB, Gov pills) | ✓ clickable | — | — |
| Click/hover explainer popovers | ✓ | — | — |
| Plain-text area names written on the shading (CS, PS, "welfare loss") | — | — | ✓ |
| Numbers on the chart (subsidy-amount chip, numeric axis tick values) | ✓ | ✓ | — (user agreed: no numbers on the diagram; whether a bare "0" at the origin stays is the builder's call) |

**Tax and subsidy pages at IB perfect** (*Claude's call*, from IB revision sources — savemyexams, studyib.net, tutor2u, tutorchase, cognito; user asked Claude to research rather than decide):
- Tax: keep the consumer/producer incidence split shading (IB answers routinely show consumer burden and producer burden as the two parts of the tax-revenue rectangle). Plain names: "consumer burden", "producer burden", "welfare loss"; CS/PS as on price controls. Curve labels stay as the code has them (S1 / S2 — IB accepts S2 or S1+tax).
- Subsidy: keep the government-spending band and the CS/PS overlap stripes (shading, not text). Plain names: "government spending", "welfare loss", CS, PS. Pc / Pp / Q1 stay.
- Long names may not fit small regions; shrink-to-fit like today's chips, falling back to a short form (e.g. "WL") or omitting — builder's call.
- Detail level is a `renderMarketChart` option contract for now; other renderers (e.g. future `elasticityChart.js`) adopt it when built — *Claude's call*. Clean/IB perfect also disable the clickable `data-region` fills, not just the chips.

**IB perfect definition** (from IB revision sources — no official markscheme specifies area marking; lettered areas A/B/C are a textbook habit, not an exam requirement, so not used): Price/Quantity axes labelled; D and S labelled; free-market Pe/Qe; ceiling/floor price with Qs and Qd and the gap labelled "shortage"/"excess supply"; CS, PS shaded and named; triangle shaded and named **"welfare loss"**; no numbers or explanations on the diagram. Sources: ibonomics.org price-ceiling and price-floor pages; ibdemystified.com price-controls notes; tuitiongenius.com price-controls model essay; owltutors.co.uk and revisiondojo.com diagram tips.

## Constraints

- Follow existing CLAUDE.md conventions: real-pixel chart text (give new on-chart labels their own class, don't reuse `.tick-label`), tokens from `tokens.css`, `--accent` pairing, tests colocated with Vitest + jsdom.
- `renderMarketChart` already takes an options object (`showSurplusLabels`); detail level should flow through the same options path rather than CSS-hiding elements that still take up label-collision space. Builder's call on mechanism.
- Must work at the 880px mobile breakpoint (stacked columns) — spotlight steps must scroll their target into view.
- No new dependencies unless clearly justified; a tour library is the builder's call, but a small hand-rolled spotlight fits the repo's plain-JS style.
- Respect `prefers-reduced-motion` for tour transitions.

## Left to the builder

- Shared module structure (e.g. `src/components/tour.js`, `src/components/detailSettings.js`, `src/lib/prefs.js`).
- Exact visual styling of the gear, popover, spotlight, bubble, and replay button (use existing tokens).
- Keyboard/accessibility details (Esc closes tour/popover, focus management).
- Updating CLAUDE.md "Definition of done" so future graph pages include the tour + gear.

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

## Open / not yet designed

- **Unit subpage structure** — especially Microeconomics, which needs its own internal browsing/grouping for ~40 diagrams rather than a flat list (likely reuses the topic-family grouping concept). Next design step after the homepage is built.
- Individual graph page template/layout (beyond the existing Equilibrium Lab page as a starting reference).
- First-release graph list (which specific pages ship at launch) — deliberately deferred; not needed to design the homepage itself.
- Analytics tool choice.
- GitHub Pages deploy workflow (base path config, GitHub Actions) — needed before the site is live, not before it's built/previewed locally.

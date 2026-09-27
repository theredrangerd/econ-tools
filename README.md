# IB Economics Interactive Graph Site

A growing collection of interactive, animated economics graph explorers for IB Economics students and teachers — evolving out of the original single-page `equilibrium-lab.html` prototype into a full site.

## The problem

Hand-drawn economics graphs, as typically sketched on a whiteboard, collapse into an illegible mess the moment a teacher starts annotating relationships on top of them — a price control, then consumer surplus, then producer surplus, then deadweight loss, often all in the same pen color. It's hard for a teacher to present clearly, and hard for a student to untangle afterward.

## The idea

It's not animation on its own that teaches — it's **interactivity**. Letting a student drag a price control and watch the surplus regions and deadweight loss update live, in clearly distinct colors, is what makes the relationship between an intervention and its welfare effect click. The site's original price-ceiling/deadweight-loss demo is the proof of concept and the quality bar every new graph page is held to.

This is a tool for building understanding of *why a graph looks the way it does* — not a substitute for the hand-drawn-diagram skill that IB exams actually test.

## Who it's for

IB Economics students and teachers. Two ways people land on the site, and both need to work well:

- **Deep link from a lesson** — a teacher shares a link to one specific graph (e.g. "price floor on cigarettes") as an in-class activity or a revision pointer. This is the dominant use case.
- **Cold browse / revision** — a student half-remembers a concept but not where it lives, and finds it via the homepage's search or its unit/topic browsing.

## How it's organized

- Graphs are grouped by official IB syllabus unit (Microeconomics, Macroeconomics, International, Development), and within each unit, by topic family (e.g. Supply & Demand: price ceiling, price floor, tax, subsidy, labor market).
- Each graph gets its own focused, individually deep-linkable page with only the controls relevant to that scenario — rather than one large page with lots of toggles — because the dominant use case is sharing a single link to a single scenario.
- The homepage has a search bar so a student can find "the triangle graph" or "minimum wage thing" without knowing the syllabus taxonomy.
- Units and topic families that aren't built yet still show up on the site (not hidden), pointing to a "work in progress" page with an embedded feedback form, so the site is honest about what's live rather than overpromising.

## Current status

The homepage and site chrome are built. Individual graph pages are being built out unit by unit, starting with Microeconomics, in the order the content is actually taught in class — Government Intervention first (price ceiling, price floor, tax, subsidy), then Market Failure, then a Demand & Supply/Elasticity backfill, then Theory of the Firm (Higher Level only) later in the year.

## Tech stack

Vite + vanilla JS, no UI framework — a small shared JS module injects common header/nav/hero markup across pages, and every page is a real static `.html` file (well suited to GitHub Pages, and keeps every graph trivially deep-linkable). Hosted on GitHub Pages, independent of any school's infrastructure.

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # production build
npm run test      # test suite
```

## Contributing / feedback

Every page (including work-in-progress ones) embeds a feedback form for requesting new graphs or reporting issues — that's the intended channel for suggestions, rather than issues/PRs.

# Teacher feedback

Feedback from Ms. Patel (IB Economics teacher), relayed by the site owner. **Logged 2026-10-26; none of it is actioned yet.** Check an item off and date it when it ships.

## Open items

- [ ] **Subsidy graph: show marginal consumer surplus and marginal producer surplus after the subsidy.** Rework the subsidy page so the post-subsidy marginal CS and marginal PS are shown. The exact visual treatment is undecided, and it interacts with the existing CS/PS overlap stripes.
- [ ] **Quantity-axis labels are wrong on the tax graph.** The axis was marked "Q1" and "Q equilibrium". Ms. Patel says it should be **Q1 and Q tax**. This was relayed verbally, so re-check which graph(s) and what the current symbols are before fixing. Her wording says "a few bugs" in axis marking, so audit every page's quantity axis against the IB convention (`drawAxisSymbols` in `src/lib/marketChart.js`, "Chart marking conventions" in the main spec), not only the tax page.
- [ ] **IB perfect: drop the "CS" / "PS" text names.** Do not write "CS" and "PS" on the shaded areas in the IB perfect diagram. This touches `drawAreaNames` in `src/lib/marketChart.js` and the IB rows of the detail-levels table in the onboarding spec. Open question: does it apply to the price-control pages too, or only the subsidy and tax pages? Confirm with her.
- [ ] **Subsidy: make the government spending box clearer, and rework its explanation.** The "government spending" region is unclear as drawn. The popover explanation of how it works (`src/lib/regionExplainers.js`) needs rewriting.

## Related

- Detail levels: `docs/superpowers/specs/2026-10-25-graph-onboarding-and-detail-settings-design.md`
- Chart marking conventions: `docs/superpowers/specs/2026-09-24-ib-econ-graph-site-design.md`

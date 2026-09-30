---
target: each graph page (government intervention)
total_score: 25
p0_count: 1
p1_count: 4
timestamp: 2026-09-29T03-12-00Z
slug: units-microeconomics-government-intervention
---
# Critique: Government Intervention diagram pages (ceiling, floor, tax, subsidy)
Method: dual-agent. Browser: headless Chrome via CDP (Claude-in-Chrome only had Windows browsers attached); overlay injection skipped.
Score 25/40 (Acceptable). Status 3, Real world 3, Control 3, Consistency 2, Error prevention 3, Recognition 2, Flexibility 2, Aesthetic 2, Error recovery 2, Help 3.
## Priority issues
- [P0] Chart text too small: 780 viewBox scaled ~0.82 desktop / ~0.4 mobile; ticks ~8.6px desktop, ~4px mobile, #838d9c (3.36:1). Needs fixed-screen-size text.
- [P1] Chart isn't the hero: legend (8 items tax/subsidy) detached below chart; 9-tile flat stat grid; ~640px feedback iframe equals the tool's height; tax wedge ~18px tall at default.
- [P1] Colour semantics: red is both DWL and family accent (toggle, eyebrow, back link, Why? link, ceiling/subsidy pills); pill colours arbitrary; native blue radios on tax.
- [P1] Contrast: teal/gold stat values 2.4/2.2:1; --ink-muted 3.1-3.4:1 on stat keys, panel h2, ticks, disclaimer; orange source label 3.3:1.
- [P1] A11y: range inputs outline:none with no focus-visible (pages.css:550); switch has no accessible name; region explainers pointer-only; no aria-live.
- [P2] Edge/collision: "Price ceiling" line label grey due to .tick-label class overriding fill (marketChart.js:226 vs pages.css:677); floor $175 closed market reports price instead of "—"; excess-supply bracket above plot; label collisions on inelastic tax.
## Detector
em-dash-overuse on all 4 pages (5-8 each, template-driven); layout-transition pages.css:701 false positive (stroke-width).

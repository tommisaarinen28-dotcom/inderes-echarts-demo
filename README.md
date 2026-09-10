# Inderes chart configuration on Apache ECharts 5 (demo)

Live page: https://tommisaarinen28-dotcom.github.io/inderes-echarts-demo/

The inderes.fi web platform renders its charts with Apache ECharts 5 (echarts-for-react, SVG renderer).
This page rebuilds the estimate-section charts of an Inderes extensive report (LapWall, pages S23 to S26)
with the same engine but the Inderes house configuration: house palette in fixed series order,
GT America / Inderes Sans, black text, sharp legend icons, one Finnish number formatter everywhere
(decimal comma, space before %), #d9d9d9 grid, diamond line markers, zero line, source footnote.
The web platform's interactions are kept: axis-pointer shadow with a per-series tooltip, pie slice emphasis.

**Demo data.** Every series on the page is rescaled with seeded random factors. The numbers are not
Inderes estimates and not figures reported by the company. Only the chart structure and configuration
are real.

Files
- `index.html` - the demo page (loads ECharts 5.6.0 from cdnjs)
- `inderes_echarts.js` - reusable theme and archetype builders (`INDERES.comboColLine`, `stacked100Col`, `floatingCol`, `doughnut`, `fiNum`, `fiPct`)
- `CONFIG_DIFF.md` - web platform option vs Inderes option, property by property

Demoaineisto: sivun luvut on skaalattu satunnaiskertoimilla eivätkä ne ole Inderesin ennusteita.

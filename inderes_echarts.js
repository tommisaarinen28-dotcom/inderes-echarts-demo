/* inderes_echarts.js - Inderes house configuration for Apache ECharts 5 (SVG renderer).
 *
 * Port of ~/.claude/skills/inderes-chart/lib/_core.py (palette, fonts, Finnish
 * formatters, axis/grid/legend rules) plus the interactive features of the
 * inderes.fi web platform (axis-pointer shadow + tooltip, pie emphasis).
 *
 * Exposes window.INDERES = { C, PALETTE, seriesColor, fiNum, fiPct, FONT,
 *   base, axisTooltip, comboColLine, stacked100Col, floatingCol, doughnut }.
 * Every archetype returns a plain ECharts option object.
 */
(function (global) {
  'use strict';

  // --- Palette (strict series order, _core.py PALETTE) ---------------------
  const C = {
    BLUE: '#3f3eff', PURPLE: '#c49cff', SAGE: '#91a77f', BLACK: '#000000',
    LIGHTGREEN: '#d4fcb3', LIGHTBLUE: '#bac8ff', PEACH: '#fccebe',
    DARKSLATE: '#303845', NEUTRAL: '#9d9d9d', LIGHTGREY: '#e1dcdc',
    OLIVE: '#5F7A4F', MIDBLUE: '#8f8eff', GRID: '#d9d9d9', TEXT: '#000000',
    SUBTLE: '#555555', WHITE: '#ffffff'
  };
  const PALETTE = [C.BLUE, C.PURPLE, C.SAGE, C.BLACK, C.LIGHTGREEN, C.LIGHTBLUE,
    C.PEACH, C.DARKSLATE, C.NEUTRAL, C.LIGHTGREY];
  // _core.series_color: skip black as 4th colour when >= 4 series.
  function seriesColor(idx, n) {
    if (n >= 4 && idx >= 3) return idx === 3 ? C.OLIVE : (PALETTE[idx] || C.NEUTRAL);
    return PALETTE[idx] || C.NEUTRAL;
  }

  const FONT = '"GT America", "Inderes Sans", Calibri, Arial, sans-serif';
  const NBSP = ' ';

  // --- Finnish number formatting (_core.fi_num / fi_pct) --------------------
  // '4,7' not '4.7'; HALF-UP rounding; thousands separated by NBSP; plain '-'.
  function fiNum(v, d) {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return '';
    d = d == null ? 1 : d;
    const f = Math.pow(10, d);
    const r = Math.round(Math.abs(Number(v)) * f + 1e-9) / f;
    const neg = Number(v) < 0 && r !== 0;
    const parts = r.toFixed(d).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    return (neg ? '-' : '') + parts[0] + (parts.length > 1 ? ',' + parts[1] : '');
  }
  // 'X,X %' WITH a space, from a 0..1 ratio.
  function fiPct(ratio, d) {
    if (ratio === null || ratio === undefined || Number.isNaN(Number(ratio))) return '';
    return fiNum(Number(ratio) * 100, d == null ? 1 : d) + NBSP + '%';
  }
  function fmtValue(v, fmt) {
    if (!fmt) return fiNum(v, 1);
    if (fmt.kind === 'pct') return fiPct(v, fmt.dec == null ? 0 : fmt.dec);
    const s = fiNum(v, fmt.dec == null ? 1 : fmt.dec);
    return fmt.unit ? s + NBSP + fmt.unit : s;
  }

  // --- Shared pieces ---------------------------------------------------------
  const marker = (color) =>
    '<span style="display:inline-block;width:10px;height:10px;background:' + color +
    ';margin-right:6px;vertical-align:-1px"></span>';

  function tooltipBox(extra) {
    return Object.assign({
      confine: true,
      backgroundColor: C.WHITE,
      borderColor: C.LIGHTGREY,
      borderWidth: 1,
      borderRadius: 0,
      padding: [8, 10],
      textStyle: { color: C.TEXT, fontSize: 12, fontFamily: FONT },
      extraCssText: 'box-shadow:0 2px 10px rgba(0,0,0,.12);max-width:min(92vw,340px);white-space:normal'
    }, extra || {});
  }

  // Axis tooltip: header = category, one line per visible series with a SQUARE
  // marker and the series' own number format (fmts[seriesIndex]).
  function axisTooltip(fmts) {
    return tooltipBox({
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.06)' } },
      formatter: function (params) {
        const ps = Array.isArray(params) ? params : [params];
        if (!ps.length) return '';
        const lines = ['<b>' + ps[0].axisValueLabel + '</b>'];
        ps.forEach(function (p) {
          const f = fmts[p.seriesIndex];
          if (!f || f.skip) return;
          const v = Array.isArray(p.value) ? p.value[p.value.length - 1] : p.value;
          if (v === null || v === undefined || v === '-') return;
          lines.push(marker(p.color) + p.seriesName + ': ' + fmtValue(Number(v), f));
        });
        return lines.join('<br/>');
      }
    });
  }

  function axisLabelFormatter(axis) {
    const kind = (axis && axis.kind) || 'num';
    const dec = axis && axis.dec != null ? axis.dec : 0;
    return kind === 'pct' ? (v) => fiPct(v, dec) : (v) => fiNum(v, dec);
  }

  function valueAxis(axis, side) {
    const right = side === 'right';
    return {
      type: 'value',
      position: side,
      min: axis.min, max: axis.max, interval: axis.interval,
      name: axis.name || '',
      nameLocation: 'end', nameGap: 6,
      nameTextStyle: { color: C.TEXT, fontSize: 12, fontFamily: FONT, align: right ? 'right' : 'left' },
      axisLine: { show: !right, lineStyle: { color: C.GRID, width: 1 } },
      axisTick: right ? { show: true, length: 3, lineStyle: { color: C.GRID } } : { show: false },
      splitLine: right ? { show: false } : { show: true, lineStyle: { color: C.GRID, width: 1 } },
      axisLabel: { color: C.TEXT, fontSize: 12, fontFamily: FONT, formatter: axisLabelFormatter(axis) }
    };
  }

  function categoryAxis(categories, extra) {
    return Object.assign({
      type: 'category',
      data: categories,
      boundaryGap: true,
      axisLine: { lineStyle: { color: C.GRID, width: 1 } },
      axisTick: { show: false },
      axisLabel: { color: C.TEXT, fontSize: 12, fontFamily: FONT }
    }, extra || {});
  }

  function legend(names) {
    return {
      bottom: 0,
      icon: 'rect',            // sharp edges (web default = roundRect)
      itemWidth: 14, itemHeight: 10, itemGap: 18,
      textStyle: { color: C.TEXT, fontSize: 12, fontFamily: FONT },
      width: '92%',
      itemStyle: { borderWidth: 0 },
      data: names
    };
  }

  function base(spec) {
    const rows = spec.legendRows || 1;
    return {
      animation: false,
      backgroundColor: 'transparent',
      textStyle: { fontFamily: FONT, fontSize: 12, color: C.TEXT },
      title: {
        left: 'center', top: 6, text: spec.title || '', subtext: spec.subtitle || '',
        itemGap: 4,
        textStyle: { fontSize: 16, fontWeight: 'bold', color: C.TEXT, fontFamily: FONT },
        subtextStyle: { fontSize: 13, color: C.SUBTLE, fontFamily: FONT }
      },
      grid: { containLabel: true, left: 8, right: 8, top: 64, bottom: rows * 24 + 28 }
    };
  }

  const zeroLine = {
    silent: true, symbol: 'none', label: { show: false },
    lineStyle: { color: C.NEUTRAL, width: 1, type: 'solid' },
    data: [{ yAxis: 0 }]
  };

  function labelPos(v) { return v >= 0 ? 'top' : 'bottom'; }

  // --- Archetype: combo columns + lines (also clustered / single bar) -------
  // spec: {title, subtitle, categories, bars:[{name,data,color,barWidth,fmt,
  //        labels:{dec, backdrop}}], lines:[{name,data,color,yAxisIndex,fmt,
  //        labels:{dec, backdrop}}], yLeft:{min,max,interval,name,kind,dec},
  //        yRight:{...}, zeroLine, legendRows}
  function comboColLine(spec) {
    const opt = base(spec);
    const fmts = [];
    const series = [];
    const legendNames = [];
    const bars = spec.bars || [];
    const lines = spec.lines || [];

    bars.forEach(function (b, i) {
      const s = {
        name: b.name, type: 'bar', data: b.data.slice(), yAxisIndex: 0,
        barWidth: b.barWidth || (bars.length > 1 ? undefined : '60%'),
        barGap: '0%',
        itemStyle: { color: b.color, borderWidth: 0 },
        z: 2
      };
      if (b.stack) s.stack = b.stack;
      if (b.labels && !b.labels.backdrop) {
        s.label = {
          show: true, position: 'top', color: C.TEXT, fontSize: 12, fontFamily: FONT,
          formatter: (p) => fiNum(p.value, b.labels.dec)
        };
        s.data = b.data.map((v) => ({ value: v, label: { position: labelPos(v) } }));
      }
      if (i === 0 && spec.zeroLine) s.markLine = zeroLine;
      series.push(s); fmts.push(b.fmt || { dec: 1 }); legendNames.push(b.name);
    });

    lines.forEach(function (l) {
      const s = {
        name: l.name, type: 'line', data: l.data.slice(),
        yAxisIndex: l.yAxisIndex || 0,
        smooth: false, symbol: 'diamond', symbolSize: 8,
        lineStyle: { width: 2.25, color: l.color },
        itemStyle: { color: l.color, borderColor: C.WHITE, borderWidth: 1 },
        emphasis: { scale: 1.4 },
        z: 5
      };
      if (l.labels && !l.labels.backdrop) {
        s.label = { show: true, position: 'top', color: C.TEXT, fontSize: 12, fontFamily: FONT,
          formatter: (p) => fiNum(p.value, l.labels.dec) };
      }
      series.push(s); fmts.push(l.fmt || { dec: 1 }); legendNames.push(l.name);
    });

    // Value labels with a white backdrop, rendered ABOVE lines (house: labels
    // drawn on the overlay axis) -> hidden line series at z 9, not in legend.
    bars.concat(lines).forEach(function (b) {
      if (!(b.labels && b.labels.backdrop)) return;
      series.push({
        name: b.name + ' (arvot)', type: 'scatter', data: b.data.map((v) => ({
          value: v, label: { position: labelPos(v) } })),
        yAxisIndex: b.yAxisIndex || 0, symbol: 'circle', symbolSize: 0.1,
        silent: true, z: 9, legendHoverLink: false, tooltip: { show: false },
        label: { show: true, color: C.TEXT, fontSize: 12, fontFamily: FONT, distance: 6,
          backgroundColor: 'rgba(255,255,255,0.85)', padding: [1, 3],
          formatter: (p) => fiNum(p.value, b.labels.dec) }
      });
      fmts.push({ skip: true });
    });

    opt.xAxis = categoryAxis(spec.categories);
    opt.yAxis = [valueAxis(spec.yLeft, 'left')];
    if (spec.yRight) opt.yAxis.push(valueAxis(spec.yRight, 'right'));
    opt.legend = legend(legendNames);
    opt.tooltip = axisTooltip(fmts);
    opt.series = series;
    return opt;
  }

  // --- Archetype: 100 % stacked columns --------------------------------------
  // spec: {categories, series:[{name,data(ratios),color,labelColor}], minLabel}
  function stacked100Col(spec) {
    const opt = base(spec);
    const minLabel = spec.minLabel == null ? 0.06 : spec.minLabel;
    const fmts = [];
    opt.series = spec.series.map(function (s) {
      fmts.push({ kind: 'pct', dec: 1 });
      return {
        name: s.name, type: 'bar', stack: 'total', data: s.data.slice(),
        barWidth: spec.barWidth || '62%',
        itemStyle: { color: s.color, borderWidth: 0 },
        label: {
          show: true, position: 'inside', fontWeight: 'bold', fontSize: 12, fontFamily: FONT,
          color: s.labelColor || C.TEXT,
          formatter: (p) => (p.value >= minLabel ? fiNum(p.value * 100, 1) : '')
        },
        z: 2
      };
    });
    opt.xAxis = categoryAxis(spec.categories);
    opt.yAxis = [valueAxis(Object.assign({ min: 0, max: 1, interval: 0.2, kind: 'pct', dec: 0 }, spec.yLeft || {}), 'left')];
    opt.legend = legend(spec.series.map((s) => s.name));
    opt.tooltip = axisTooltip(fmts);
    return opt;
  }

  // --- Archetype: floating columns (guidance range vs actual), N panels -------
  // spec: {categories, panels:[{title, min,max,interval, dec,
  //        initial:[[lo,hi]...], revisions:[[lo,hi]|null...], actual:[v|null...],
  //        verdict:['sisalla'|'yli'|'alle'|'avoin'...]}], revisionLabel, height}
  function floatingCol(spec) {
    const opt = base(spec);
    const VERDICT = { sisalla: C.BLUE, yli: C.SAGE, alle: C.PEACH, avoin: C.LIGHTGREY };
    const VNAME = { sisalla: 'Toteuma haarukassa', yli: 'Toteuma yli', alle: 'Toteuma alle' };
    const n = spec.panels.length;
    const rows = spec.legendRows || 2;
    const top = 84, bottom = rows * 24 + 28, gap = 40;
    const grids = [], xAxes = [], yAxes = [], series = [], titles = [opt.title];
    const revName = spec.revisionLabel || 'Päivitetty haarukka';
    const legendNames = ['Ohjeistushaarukka', revName, VNAME.sisalla, VNAME.yli, VNAME.alle];

    spec.panels.forEach(function (p, gi) {
      grids.push({ containLabel: true, left: 8, right: 8, top: 0, height: 0 });
      xAxes.push(categoryAxis(spec.categories, { gridIndex: gi }));
      yAxes.push(Object.assign(valueAxis({ min: p.min, max: p.max, interval: p.interval, kind: 'num', dec: 0 }, 'left'), { gridIndex: gi }));
      titles.push({ text: p.title, left: 8, top: 0,
        textStyle: { fontSize: 12, fontWeight: 'bold', color: C.TEXT, fontFamily: FONT } });

      // initial range: transparent base + visible range (stacked)
      series.push({ name: '_base' + gi, type: 'bar', stack: 'init' + gi, xAxisIndex: gi, yAxisIndex: gi,
        data: p.initial.map((r) => r[0]), barWidth: '56%', silent: true,
        itemStyle: { color: 'transparent', borderWidth: 0 }, emphasis: { disabled: true }, z: 1 });
      series.push({ name: 'Ohjeistushaarukka', type: 'bar', stack: 'init' + gi, xAxisIndex: gi, yAxisIndex: gi,
        data: p.initial.map((r) => r[1] - r[0]), barWidth: '56%',
        itemStyle: { color: C.LIGHTBLUE, borderWidth: 0 }, z: 2 });

      // revision: custom rect centred on the category, 30 % wide, overlaid
      series.push({ name: revName, type: 'custom', xAxisIndex: gi, yAxisIndex: gi,
        data: p.revisions.map((r, i) => (r ? [i, r[0], r[1]] : null)).filter(Boolean),
        itemStyle: { color: C.BLUE },
        renderItem: function (params, api) {
          const x = api.value(0), lo = api.value(1), hi = api.value(2);
          const p0 = api.coord([x, hi]), p1 = api.coord([x, lo]);
          const w = api.size([1, 0])[0] * 0.30;
          return { type: 'rect', shape: { x: p0[0] - w / 2, y: p0[1], width: w, height: p1[1] - p0[1] },
            style: { fill: C.BLUE } };
        }, z: 3 });

      // actuals: one scatter series per verdict class (drives legend colours)
      ['sisalla', 'yli', 'alle'].forEach(function (vk) {
        const pts = [];
        p.actual.forEach(function (a, i) {
          if (a == null || p.verdict[i] !== vk) return;
          pts.push({ value: [i, a] });
        });
        series.push({ name: VNAME[vk], type: 'scatter', xAxisIndex: gi, yAxisIndex: gi, data: pts,
          symbol: 'diamond', symbolSize: 12,
          itemStyle: { color: VERDICT[vk], borderColor: C.TEXT, borderWidth: 0.5 }, z: 6 });
      });
      // value labels 0,34 category widths right of the marker (clear of the 56 % bar),
      // drawn by a custom series so the offset follows the rendered category width
      series.push({ name: '_lbl' + gi, type: 'custom', xAxisIndex: gi, yAxisIndex: gi,
        data: p.actual.map((a, i) => (a == null ? null : [i, a])).filter(Boolean),
        silent: true, legendHoverLink: false, tooltip: { show: false }, z: 7,
        renderItem: function (params, api) {
          const pt = api.coord([api.value(0), api.value(1)]);
          const w = api.size([1, 0])[0];
          return { type: 'text', style: { x: pt[0] + w * 0.34, y: pt[1], text: fiNum(api.value(1), p.dec),
            fill: C.TEXT, font: 'bold 12px ' + FONT, textAlign: 'left', textVerticalAlign: 'middle' } };
        } });
    });

    // pixel layout of the stacked panels (call again on resize with the new height)
    opt._layout = function (h) {
      const band = h - top - bottom - gap * (n - 1);
      const ph = band / n;
      grids.forEach(function (g, gi) { g.top = top + gi * (ph + gap); g.height = ph; });
      titles.slice(1).forEach(function (t, gi) { t.top = top + gi * (ph + gap) - 28; });
      opt.grid = grids; opt.title = titles;
      return opt;
    };
    opt._layout(spec.height || 760);
    opt.xAxis = xAxes; opt.yAxis = yAxes; opt.series = series;
    opt.legend = legend(legendNames);
    opt.tooltip = tooltipBox({
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.06)' } },
      formatter: function (params) {
        const ps = Array.isArray(params) ? params : [params];
        if (!ps.length) return '';
        const gi = series[ps[0].seriesIndex].xAxisIndex || 0;
        const p = spec.panels[gi];
        const i = ps[0].dataIndex;
        const unit = NBSP + 'MEUR';
        const lines = ['<b>' + ps[0].axisValueLabel + '</b> ' + p.title.split(',')[0]];
        const r = p.initial[i];
        lines.push(marker(C.LIGHTBLUE) + 'Ohjeistushaarukka: ' + fiNum(r[0], 1) + '–' + fiNum(r[1], 1) + unit);
        if (p.revisions[i]) lines.push(marker(C.BLUE) + revName + ': ' + fiNum(p.revisions[i][0], 1) + '–' + fiNum(p.revisions[i][1], 1) + unit);
        if (p.actual[i] != null) lines.push(marker(VERDICT[p.verdict[i]]) + 'Toteuma: ' + fiNum(p.actual[i], p.dec) + unit + ' (' + (VNAME[p.verdict[i]] || '').replace('Toteuma ', '') + ')');
        else lines.push(marker(C.LIGHTGREY) + 'Toteuma: avoin');
        return lines.join('<br/>');
      }
    });
    return opt;
  }

  // --- Archetype: doughnut (two rings) --------------------------------------
  // spec: {outer:[{name,value,color}], inner:[{name,value,color,hideLegend}],
  //        center:{text, subtext}, approx, valueNote}
  function doughnut(spec) {
    const opt = base(spec);
    const note = spec.valueNote ? ' (' + spec.valueNote + ')' : '';
    const itemTip = tooltipBox({
      trigger: 'item',
      formatter: (p) => marker(p.color) + p.name + ': ' + (spec.approx ? 'n.' + NBSP : '') + fiNum(p.value, 0) + NBSP + '%' + note
    });
    const emphasis = {
      scale: true, scaleSize: 6,
      label: { show: true, fontSize: 14, fontWeight: 'bold', overflow: 'break', width: 120, lineHeight: 16 },
      itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' }
    };
    // Static slice labels off (the legend names the slices, house C43 rule);
    // the hovered slice shows its name bold, as on the web platform.
    const ring = (data, radius, outside) => ({
      type: 'pie', radius: radius, center: ['40%', '56%'], startAngle: 90, clockwise: true,
      avoidLabelOverlap: true, data: data.map((d) => ({ name: d.name, value: d.value,
        itemStyle: { color: d.color } })),
      itemStyle: { borderColor: C.WHITE, borderWidth: 2 },
      label: { show: false, position: outside ? 'outside' : 'inside', color: C.TEXT, fontSize: 12,
        fontFamily: FONT, formatter: '{b}' },
      labelLine: { show: false, length: 12, length2: 10, lineStyle: { color: C.GRID } },
      emphasis: Object.assign({}, emphasis, { labelLine: { show: outside } }),
      z: outside ? 3 : 2
    });
    opt.series = [ring(spec.outer, ['46%', '66%'], true), ring(spec.inner, ['27%', '38%'], false)];
    opt.legend = Object.assign(legend(
      spec.outer.map((d) => d.name).concat(spec.inner.filter((d) => !d.hideLegend).map((d) => d.name))),
      { orient: 'vertical', left: '70%', top: 'middle', bottom: undefined, width: undefined, itemGap: 10 });
    opt.tooltip = itemTip;
    if (spec.center) {
      opt.title = [opt.title, { text: spec.center.text, subtext: spec.center.subtext,
        left: '38%', top: '47%', textAlign: 'center', itemGap: 2,
        textStyle: { fontSize: 15, fontWeight: 'bold', color: C.TEXT, fontFamily: FONT },
        subtextStyle: { fontSize: 12, color: C.TEXT, fontFamily: FONT } }];
    }
    delete opt.grid;
    return opt;
  }

  global.INDERES = { C, PALETTE, seriesColor, fiNum, fiPct, FONT,
    base, axisTooltip, comboColLine, stacked100Col, floatingCol, doughnut };
})(typeof window !== 'undefined' ? window : this);

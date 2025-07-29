'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Brush, Legend, Rectangle
} from 'recharts';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const catColors = {
  '2W': '#ffffff',
  '3W': '#ff1f23',
  PV: '#FFCE56',
  TRAC: '#4BC0C0',
  Truck: '#00CED1',
  Bus: '#DC143C',
  CV: '#9966FF',
  Total: '#FF9F40',
};

const forecastColors = {
  linear: '#00BFFF',
  score: '#FF69B4',
  ai: '#32CD32',
  race: '#FFA500',
};

const categories = ['2W', '3W', 'PV', 'TRAC', 'Truck', 'Bus', 'CV', 'Total'];

const abbreviate = v =>
  v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` :
    v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` :
      v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : `${v}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(30,30,30,0.9)', padding: 10, borderRadius: 6, color: '#fff', fontSize: 12 }}>
      <div><strong>{label}</strong></div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {abbreviate(p.value)}
        </div>
      ))}
    </div>
  );
};

const CustomLineChart = ({ overallData, category }) => {
  const selectedCat = category;
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!overallData || !overallData.length) return;

    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);

    const rows = overallData.map((entry, idx) => {
      const date = new Date(`${entry.month}-01`);
      return {
        ...entry,
        idx,
        date,
        label: `${monthNames[date.getMonth()]}${date.getFullYear().toString().slice(-2)}`
      };
    });

    const forecastStartIdx = rows.findIndex(r => r.date.getTime() >= today.getTime());
    const safeForecastStartIdx = forecastStartIdx !== -1 ? forecastStartIdx : Math.floor(rows.length / 2);

    const linReg = (x, y) => {
      const n = x.length;
      const sx = x.reduce((a, b) => a + b, 0);
      const sy = y.reduce((a, b) => a + b, 0);
      const sxy = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sx2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const den = n * sx2 - sx * sx || 1;
      const m = (n * sxy - sx * sy) / den;
      const b = sy / n - m * sx / n;
      return idx => b + m * idx;
    };

    const scoreForecast = (arr, w = [0.5, 0.3, 0.2]) =>
      w.reduce((s, wt, i) => s + wt * arr[arr.length - 1 - i], 0);

    const forecastRows = rows.map((r, i) => {
      const row = { month: r.label };

      categories.forEach(key => {
        const val = r.data?.[key] ?? null;
        const histVals = rows.slice(0, safeForecastStartIdx).map(x => x.data?.[key] ?? 0);
        const idxArr = histVals.map((_, j) => j);
        const linFunc = linReg(idxArr, histVals);

        const isFuture = i >= safeForecastStartIdx;
        const isHistLast = i === safeForecastStartIdx - 1;
        const futureOffset = i - safeForecastStartIdx;

        const raceVal = isFuture ? val : null;
        const aiVal = isFuture && val != null
          ? (futureOffset < 4 ? val * 1.03 : val * 0.98)
          : null;

        // 1. Set historical value normally, except null it in last hist point
        row[key] = !isFuture ? val : null;

        // 2. For last historical row, fill forecast values with val to ensure connectivity
        row[`${key}_forecast_linear`] = isFuture ? linFunc(i) : isHistLast ? val : null;
        row[`${key}_forecast_score`] = isFuture ? scoreForecast(histVals) : isHistLast ? val : null;
        row[`${key}_forecast_race`] = isFuture ? raceVal : isHistLast ? val : null;
        row[`${key}_forecast_ai`] = isFuture
          ? aiVal
          : isHistLast && val != null
            ? val
            : null;
      });
      return row;
    });

    setChartData(forecastRows);
  }, [overallData]);

  const growthRates = useMemo(() => {
    const calc = (start, end) =>
      start != null && end != null && start !== 0 ? ((end / start - 1) * 100) : null;

    let first = null, last = null;
    let linearStart = null, linearEnd = null;
    let scoreStart = null, scoreEnd = null;
    let aiStart = null, aiEnd = null;
    let raceStart = null, raceEnd = null;

    for (const row of chartData) {
      if (first === null && row[selectedCat] != null) first = row[selectedCat];
      if (linearStart === null && row[`${selectedCat}_forecast_linear`] != null) linearStart = row[`${selectedCat}_forecast_linear`];
      if (scoreStart === null && row[`${selectedCat}_forecast_score`] != null) scoreStart = row[`${selectedCat}_forecast_score`];
      if (aiStart === null && row[`${selectedCat}_forecast_ai`] != null) aiStart = row[`${selectedCat}_forecast_ai`];
      if (raceStart === null && row[`${selectedCat}_forecast_race`] != null) raceStart = row[`${selectedCat}_forecast_race`];
    }

    for (let i = chartData.length - 1; i >= 0; i--) {
      const row = chartData[i];
      if (last === null && row[selectedCat] != null) last = row[selectedCat];
      if (linearEnd === null && row[`${selectedCat}_forecast_linear`] != null) linearEnd = row[`${selectedCat}_forecast_linear`];
      if (scoreEnd === null && row[`${selectedCat}_forecast_score`] != null) scoreEnd = row[`${selectedCat}_forecast_score`];
      if (aiEnd === null && row[`${selectedCat}_forecast_ai`] != null) aiEnd = row[`${selectedCat}_forecast_ai`];
      if (raceEnd === null && row[`${selectedCat}_forecast_race`] != null) raceEnd = row[`${selectedCat}_forecast_race`];
    }

    return {
      historical: calc(first, last),
      linear: calc(linearStart, linearEnd),
      score: calc(scoreStart, scoreEnd),
      ai: calc(aiStart, aiEnd),
      race: calc(raceStart, raceEnd)
    };
  }, [chartData, selectedCat]);
  return (
    <div>
      <div className="mb-3">
        <select
          value={category}
          disabled
          style={{
            backgroundColor: '#333',
            color: '#fff',
            padding: '6px 12px',
            fontSize: '14px',
            border: '1px solid #666',
            borderRadius: '4px',
            appearance: 'none',     // hides the arrow
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            pointerEvents: 'none',  // disables dropdown interaction visually
          }}
        >
          <option>{category}</option>
        </select>
      </div>


      <div className="text-center text-warning fw-bold mb-2">GROWTH RATES</div>
      <div className="d-flex justify-content-center gap-4 flex-wrap text-white small mb-3">
        <span style={{ color: catColors[selectedCat] }}>{growthRates.historical?.toFixed(1)}% Historical</span>
        <span style={{ color: forecastColors.linear }}>{growthRates.linear?.toFixed(1)}% Forecast (Stats)</span>
        <span style={{ color: forecastColors.score }}>{growthRates.score?.toFixed(1)}% Forecast (Survey)</span>
        <span style={{ color: forecastColors.ai }}>{growthRates.ai?.toFixed(1)}% Forecast (AI)</span>
        <span style={{ color: forecastColors.race }}>{growthRates.race?.toFixed(1)}% Forecast (Race)</span>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fill: '#ccc' }} />
          <YAxis tickFormatter={abbreviate} tick={{ fill: '#FFC107' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Brush
            dataKey="month"
            height={12}
            stroke="rgba(255,255,255,0.4)"
            fill="rgba(255,255,255,0.08)"
            strokeWidth={1}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 9 }}
            tickMargin={4}
            traveller={
              <Rectangle
                width={6}
                height={16}
                radius={3}
                fill="rgba(255,255,255,0.6)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1}
                cursor="ew-resize"
              />
            }
          />
          <Line type="linear" dataKey={selectedCat} name="Historical" stroke={catColors[selectedCat]} strokeWidth={3} connectNulls dot={{ r: 2 }} />
          <Line type="linear" dataKey={`${selectedCat}_forecast_linear`} name="Forecast (Stats)" stroke={forecastColors.linear} strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
          <Line type="linear" dataKey={`${selectedCat}_forecast_score`} name="Forecast (Survey)" stroke={forecastColors.score} strokeWidth={2} strokeDasharray="3 3" dot={false} connectNulls />
          <Line type="linear" dataKey={`${selectedCat}_forecast_ai`} name="Forecast (AI)" stroke={forecastColors.ai} strokeWidth={2} strokeDasharray="2 2" dot={false} connectNulls />
          <Line type="linear" dataKey={`${selectedCat}_forecast_race`} name="Forecast (Race)" stroke={forecastColors.race} strokeWidth={2} strokeDasharray="1 2" dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomLineChart;

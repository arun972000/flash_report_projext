'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Brush, Rectangle,
} from 'recharts';
import '../styles/chart.css';

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
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const manualRaceForecast = {
  '2W': [
    1362615, 1522055, 1696639, 1660090, 1446619,
    1496596, 1585645, 1326221, 1621500, 1612050, 1365987
  ],
  '3W': [
    94206, 99388, 99785, 104460, 100621,
    102850, 104600, 95022, 106800, 107599, 95789
  ],
  'PV': [
    312429, 356907, 360520, 308106, 294308,
    308967, 315796, 255789, 360875, 340567, 298567
  ],
  'TRAC': [
    62762, 70765, 58754, 69643, 75220,
    71222, 86000, 72512, 76222, 72888, 63454
  ],
  'CV': [
    78691, 89698, 87355, 77260, 74233,
    73833, 77013, 77680, 84055, 90616, 72868
  ],
  'Truck': [
    69222, 76816, 72554, 63380, 59959,
    60872, 63389, 63398, 68657, 74218, 59399
  ],
  'Bus': [
    9469, 12882, 14801, 13880, 14274,
    12961, 13624, 14282, 15398, 16398, 13469
  ],
  'Total': [
    1910703, 2138813, 2303053, 2219559, 1991001,
    2053468, 2169054, 1827224, 2249452, 2223719, 1896665
  ]
};



const abbreviate = v =>
  v >= 1e9 ? `${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B` :
    v >= 1e6 ? `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M` :
      v >= 1e3 ? `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K` : v.toString();

const CustomTooltip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div style={{ background: '#333', color: '#fff', padding: 10, borderRadius: 5 }}>
      <p style={{ margin: '0 0 4px 0' }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color, fontSize: 12, margin: 0 }}>
          {e.name}: {e.value?.toLocaleString()}
        </p>
      ))}
    </div>
  ) : null;

const CustomLegend = ({ selectedCat }) => (
  <div style={{
    display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20,
    color: '#fff', marginTop: 16
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 20, height: 3, background: catColors[selectedCat], borderRadius: 2 }} />
      <span style={{ fontSize: 13 }}>{selectedCat}</span>
    </div>
  </div>
);

const CustomLineChart = () => {
  const [data, setData] = useState([]);
  const [selectedCat, setCat] = useState('PV');
  const [chartHeight, setHeight] = useState(420);

  useEffect(() => {
    const resize = () => setHeight(window.innerWidth < 768 ? 280 : 420);
    resize(); window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const linReg = (x, y) => {
      const n = x.length, sx = x.reduce((a, b) => a + b, 0), sy = y.reduce((a, b) => a + b, 0),
        sxy = x.reduce((s, xi, i) => s + xi * y[i], 0),
        sx2 = x.reduce((s, xi) => s + xi * xi, 0),
        den = n * sx2 - sx * sx || 1,
        m = (n * sxy - sx * sy) / den,
        b = sy / n - m * sx / n;
      return idx => b + m * idx;
    };

    const scoreForecast = (arr, w = [0.5, 0.3, 0.2]) =>
      w.reduce((s, wt, i) => s + wt * arr[arr.length - 1 - i], 0);

    const expoSmooth = (arr, a = 0.5) => {
      let f = arr[0];
      return () => { f = a * arr.at(-1) + (1 - a) * f; return f; };
    };

    (async () => {
      try {
        const res = await fetch('/api/overall');
        const raw = await res.json();
        const today = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const rows = raw.map((r, i) => ({ ...r, idx: i, date: new Date(`${r.month}-01`) }));

        const cats = [
          { key: '2W', src: '2-wheeler' },
          { key: '3W', src: '3-wheeler' },
          { key: 'PV', src: 'passenger' },
          { key: 'TRAC', src: 'tractor' },
          { key: 'Truck', src: 'truck' },
          { key: 'Bus', src: 'bus' },
          { key: 'CV', src: 'cv' },
          { key: 'Total', src: 'total' }
        ];

        const forecasters = {};
        cats.forEach(({ key, src }) => {
          const hist = rows.filter(r => r.date <= today);
          const idxArr = hist.map(r => r.idx);
          const valArr = hist.map(r => r[src]);
          forecasters[key] = {
            linear: linReg(idxArr, valArr),
            score: () => scoreForecast(valArr),
            ai: expoSmooth(valArr)
          };
        });

        const baseForecastIdx = rows.findIndex(row => row.month === '2025-02');
        const lastHistIdx = Math.max(...rows.filter(r => r.date <= today).map(r => r.idx));

        const transformed = rows.map(r => {
          const [y, m] = r.month.split('-');
          const label = `${monthNames[+m - 1]}${y.slice(2)}`;
          const out = { month: label };

          cats.forEach(({ key, src }) => {
            const isPast = r.date < today;
            const isPresent = r.date.getTime() === today.getTime();
            const isFuture = r.date > today;

            out[key] = (isPast || isPresent) ? r[src] : null;

            const f = forecasters[key];

            if (isFuture) {
              const lin = f.linear(r.idx);
              const sco = f.score();
              const ai = f.ai();
              const manualVal = manualRaceForecast[key]?.[r.idx - baseForecastIdx] ?? null;

              out[`${key}_forecast_linear`] = lin;
              out[`${key}_forecast_score`] = sco;
              out[`${key}_forecast_ai`] = ai;
              out[`${key}_forecast_race`] = manualVal;
            } else if (r.idx === lastHistIdx) {
              const anchor = r[src];
              out[`${key}_forecast_linear`] =
                out[`${key}_forecast_score`] =
                out[`${key}_forecast_ai`] =
                out[`${key}_forecast_race`] = anchor;
            } else {
              out[`${key}_forecast_linear`] =
                out[`${key}_forecast_score`] =
                out[`${key}_forecast_ai`] =
                out[`${key}_forecast_race`] = null;
            }
          });

          return out;
        });

        setData(transformed);
      } catch (err) {
        console.error('fetch/forecast error', err);
      }
    })();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: 0 }}>
      <div style={{ marginBottom: 16, textAlign: 'left' }}>
        <select
          value={selectedCat}
          onChange={e => setCat(e.target.value)}
          style={{ padding: '4px 8px', fontSize: 14, color: 'black' }}
        >
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <defs>
            {categories.map(cat => (
              <linearGradient id={`${cat}-grad`} key={cat} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={catColors[cat]} stopOpacity={0.9} />
                <stop offset="100%" stopColor={catColors[cat]} stopOpacity={0.3} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <XAxis dataKey="month" axisLine={false} tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            tickFormatter={abbreviate} tickCount={5}
            domain={['auto', 'auto']} interval="preserveStartEnd" />
          <Brush dataKey="month" height={12} stroke="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.08)"
            strokeWidth={1} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 9 }} tickMargin={4}
            traveller={<Rectangle width={6} height={16} radius={3}
              fill="rgba(255,255,255,0.6)" stroke="rgba(255,255,255,0.4)"
              strokeWidth={1} cursor="ew-resize" />} />
          <Tooltip content={<CustomTooltip />} />

          <Line type="linear" dataKey={selectedCat} name={`Historical ${selectedCat}`}
            stroke={`url(#${selectedCat}-grad)`} strokeWidth={1.8}
            dot={{ r: 2, fill: catColors[selectedCat] }}
            connectNulls={false} isAnimationActive={false} />

          <Line type="linear" dataKey={`${selectedCat}_forecast_linear`} name={`Linear ${selectedCat}`}
            stroke={forecastColors.linear} strokeWidth={1.5}
            strokeDasharray="5 2" dot={false} connectNulls />
          <Line type="linear" dataKey={`${selectedCat}_forecast_score`} name={`Score ${selectedCat}`}
            stroke={forecastColors.score} strokeWidth={1.5}
            strokeDasharray="2 2" dot={false} connectNulls />
          <Line type="linear" dataKey={`${selectedCat}_forecast_ai`} name={`AI ${selectedCat}`}
            stroke={forecastColors.ai} strokeWidth={1.5}
            strokeDasharray="4 4" dot={false} connectNulls />
          <Line type="linear" dataKey={`${selectedCat}_forecast_race`} name={`Race ${selectedCat}`}
            stroke={forecastColors.race} strokeWidth={1.5}
            strokeDasharray="1 6" dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>

      <CustomLegend selectedCat={selectedCat} />
    </div>
  );
};

export default CustomLineChart;
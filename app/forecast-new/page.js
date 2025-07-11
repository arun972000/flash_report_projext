// File: app/forecast-new/page.js
"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Brush,
  Rectangle,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { FaClipboardList, FaBolt } from "react-icons/fa";
import "./forecast.css";
import GlobalStyles from "./GlobalStyles";
import Footer from "./Footer";
// Hook for linear regression forecast
import { useLinearRegressionForecast } from "../hooks/LinearRegressionForecast";
// Hook for score based forecast
import { useForecastGrowth } from "../hooks/useForecastGrowth";
import { useAverageYearlyScores } from "../hooks/useAverageYearlyScores";

export default function ForecastPage() {
  const router = useRouter();

  // ─── UI state ─────────────────────────────────────────────────────
  const [isLogoHover, setLogoHover] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDatasetHovering, setIsDatasetHovering] = useState(false);
  const [isRegionsHovering, setIsRegionsHovering] = useState(false);
  const [loading, setLoading] = useState(true);

  // ─── fetched data ─────────────────────────────────────────────────
  const [graphs, setGraphs] = useState([]);
  const [volumeDataMap, setVolumeDataMap] = useState({});
  const [hierarchyMap, setHierarchyMap] = useState({});
  const [contentHierarchyNodes, setContentHierarchyNodes] = useState([]);
  const [scoreSettings, setScoreSettings] = useState({ yearNames: [] });
  const [submissions, setSubmissions] = useState([]);

  // ─── user selections ─────────────────────────────────────────────────
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [selectedGraphId, setSelectedGraphId] = useState(null);

  // ─── track which regions are expanded ─────────────────────────────────
  const [openRegions, setOpenRegions] = useState({});

  // ─── Fetch all needed data once ─────────────────────────────────────
  useEffect(() => {
    fetch("/api/graphs", {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
      },
    })
      .then((r) => r.json())
      .then(setGraphs)
      .catch(console.error);

    fetch("/api/volumeData", {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
      },
    })
      .then((r) => r.json())
      .then((arr) => {
        const m = {};
        arr.forEach((d) => {
          const cleanData = Object.fromEntries(
            Object.entries(d.data)
              .filter(
                ([region, years]) => region != null && Object.keys(years).length
              )
              .map(([region, years]) => [
                region,
                Object.fromEntries(
                  Object.entries(years).map(([yr, val]) => [
                    yr,
                    Number(String(val).replace(/,/g, "")) || 0,
                  ])
                ),
              ])
          );
          m[d.id] = { ...d, data: cleanData };
        });
        setVolumeDataMap(m);
      })
      .catch(console.error);

    // fetch contentHierarchy (nodes include id, name, parent_id)
    fetch("/api/contentHierarchy", {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
      },
    })
      .then((r) => r.json())
      .then((arr) => {
        setContentHierarchyNodes(arr);
        // build id→name map
        const m = {};
        arr.forEach((node) => {
          m[node.id] = node.name;
        });
        setHierarchyMap(m);
      })
      .catch(console.error);

    fetch("/api/scoreSettings", {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
      },
    })
      .then((r) => r.json())
      .then((data) => setScoreSettings(data))
      .catch(console.error);

    // pull in the submissions, questions & settings so we can compute averages
    Promise.all([
      fetch("/api/saveScores", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
      }),
      fetch("/api/questions", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
      }),
      fetch("/api/scoreSettings", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
      }),
    ])
      .then(async ([subRes, qRes, sRes]) => {
        if (!subRes.ok || !qRes.ok || !sRes.ok) throw new Error();
        const { submissions: rawSubs } = await subRes.json();
        const questions = await qRes.json();
        const { yearNames } = await sRes.json();

        // build posAttrs, negAttrs & weights
        const posAttrs = [],
          negAttrs = [],
          weights = {};
        questions.forEach((q) => {
          const key = String(q.id);
          weights[key] = Number(q.weight) || 0;
          const attr = { key, label: q.text };
          q.type === "positive" ? posAttrs.push(attr) : negAttrs.push(attr);
        });

        // enrich submissions with posScores/negScores
        const enriched = rawSubs.map((sub) => {
          const posScores = {},
            negScores = {};
          posAttrs.forEach(
            (a) => (posScores[a.key] = Array(yearNames.length).fill(0))
          );
          negAttrs.forEach(
            (a) => (negScores[a.key] = Array(yearNames.length).fill(0))
          );
          sub.scores.forEach(({ questionId, yearIndex, score, skipped }) => {
            if (skipped) return;
            const k = String(questionId);
            if (posScores[k]) posScores[k][yearIndex] = score;
            if (negScores[k]) negScores[k][yearIndex] = score;
          });
          return {
            id: sub.id,
            createdAt: sub.createdAt,
            posAttributes: posAttrs,
            negAttributes: negAttrs,
            posScores,
            negScores,
            weights,
            yearNames,
          };
        });

        setSubmissions(enriched);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // ─── Compute “categories → regions → countries” from contentHierarchyNodes ─
  // Replace <YOUR_PARENT_ID> with actual parent node ID from backend
  const ROOT_PARENT_ID = "76";

  // 1) Categories = nodes whose parent_id === ROOT_PARENT_ID
  const categories = useMemo(() => {
    return contentHierarchyNodes.filter(
      (node) => node.parent_id == ROOT_PARENT_ID
    );
  }, [contentHierarchyNodes]);

  // 2) Regions = children of selectedCategoryId
  const regions = useMemo(() => {
    if (!selectedCategoryId) return [];
    return contentHierarchyNodes.filter(
      (node) => node.parent_id === selectedCategoryId
    );
  }, [contentHierarchyNodes, selectedCategoryId]);

  // 3) All Regions–level node (name “All Regions”)
  const allRegionsNode = useMemo(() => {
    if (!selectedCategoryId) return null;
    return (
      contentHierarchyNodes.find(
        (node) =>
          node.parent_id === selectedCategoryId && node.name === "All Regions"
      ) || null
    );
  }, [contentHierarchyNodes, selectedCategoryId]);

  // 4) Actual “displayable” regions = filter out the “All Regions” node
  const displayRegions = useMemo(() => {
    if (!selectedCategoryId) return [];
    return regions.filter((r) => r.id !== (allRegionsNode?.id ?? -1));
  }, [regions, allRegionsNode]);

  // 5) Countries grouped by region ID
  const countriesByRegion = useMemo(() => {
    const lookup = {};
    displayRegions.forEach((region) => {
      lookup[region.id] = contentHierarchyNodes.filter(
        (node) => node.parent_id === region.id
      );
    });
    return lookup;
  }, [contentHierarchyNodes, displayRegions]);

  // 6) All country IDs under all regions
  const allCountryIds = useMemo(() => {
    return displayRegions.flatMap((region) =>
      contentHierarchyNodes
        .filter((node) => node.parent_id === region.id)
        .map((node) => node.id)
    );
  }, [contentHierarchyNodes, displayRegions]);

  // ─── 7) IDs of direct children under the “All Regions” node ─────────────
  const allRegionsChildrenIds = useMemo(() => {
    if (!allRegionsNode) return [];
    return contentHierarchyNodes
      .filter((node) => node.parent_id === allRegionsNode.id)
      .map((node) => node.id);
  }, [contentHierarchyNodes, allRegionsNode]);

  // ─── Derive selectedCountriesList based on selectedRegionId ───────────────
  const selectedCountriesList = useMemo(() => {
    if (!selectedRegionId) return [];
    if (allRegionsNode && selectedRegionId === allRegionsNode.id) {
      // “All Regions” selected → only its direct children
      return allRegionsChildrenIds;
    }
    // Otherwise, a single country ID
    return [selectedRegionId];
  }, [selectedRegionId, allRegionsNode, allCountryIds]);

  // ─── Available graphs filtered by selectedCountriesList ──────────────────
  const availableGraphs = useMemo(() => {
    if (!selectedCountriesList.length) return [];
    return graphs.filter((g) => {
      // Normalize dataset_ids into an array:
      const dsIds = Array.isArray(g.dataset_ids)
        ? g.dataset_ids
        : [g.dataset_ids];
      return dsIds.some((dsId) => {
        const ds = volumeDataMap[dsId];
        if (!ds?.stream) return false;
        const parts = ds.stream.split(",").map((n) => parseInt(n, 10));
        return parts.some((part) => selectedCountriesList.includes(part));
      });
    });
  }, [graphs, volumeDataMap, selectedCountriesList]);

  const selectedDataset = useMemo(() => {
    if (!selectedGraphId) return null;

    // 1) find the graph object the user selected
    const graph = graphs.find((g) => g.id === selectedGraphId);
    if (!graph) return null;

    // 2) Normalize `graph.dataset_ids` into an array
    const dsIds = Array.isArray(graph.dataset_ids)
      ? graph.dataset_ids
      : [graph.dataset_ids];

    // 3) Always take the first one
    const firstDsId = dsIds[0];
    return volumeDataMap[firstDsId] || null;
  }, [selectedGraphId, graphs, volumeDataMap]);

  // ─── Build chartData from selectedDataset ────────────────
  const chartData = useMemo(() => {
    if (!selectedDataset?.data) return [];
    const data = selectedDataset.data;

    // Take the very first key in data (no filtering by selectedCountriesList)
    const firstKey = Object.keys(data)[0];
    if (!firstKey) return [];

    // That firstKey’s value is an object like { "2019": 119018, "2020": 102203, … }
    const series = data[firstKey];

    // Sort the years and build one row per year
    const years = Object.keys(series).sort();
    return years.map((year) => ({
      year,
      [firstKey]: series[year] ?? 0,
    }));
  }, [selectedDataset]);

  // ─── Build pieData ────────────────────────────────────
  const pieData = useMemo(() => {
    if (!selectedDataset?.data?.data) return [];
    const yearData = selectedDataset.data.data;

    return Object.entries(yearData).map(([year, value]) => ({
      name: year,
      value: value,
    }));
  }, [selectedDataset]);

  // ─── Aggregate historical volumes (sum across selected countries per year) ─
  const historicalVolumes = useMemo(() => {
    return chartData.map((row) => row.data || 0);
  }, [chartData]);

  // ─── Compute average scores per year from submissions ──────────────────────
  const { yearNames: scoreYearNames, averages: avgScores } =
    useAverageYearlyScores(submissions);
  const avgScoreValues = avgScores.map((a) => Number(a.avg));

  // ─── Forecast data (linear regression) ────────────────────────────────────
  const forecastDataLR = useLinearRegressionForecast(
    historicalVolumes,
    scoreSettings.yearNames || []
  );

  // ─── Forecast data (survey‐based) ─────────────────────────────────────────
  const forecastDataScore = useForecastGrowth(
    historicalVolumes,
    avgScoreValues
  );

  // ─── Combine historical + linear forecast ─────────────────────────────────
  const combinedData = useMemo(() => {
    console.log("chartdata ", chartData);
    // console.log("selectedgraphid " , selectedGraphId);
    // console.log("forecastdatalr ", forecastDataLR);
    // console.log("historicalvolumes ", historicalVolumes);
    // console.log("avgscorevalues ", avgScoreValues);
    // console.log("selectedCountriesList" , selectedCountriesList);
    // console.log("selected Dataset ", selectedDataset);

    if (!chartData.length) return [];
    const hist = historicalVolumes.map((v, i) => ({
      year: Number(chartData[i].year),
      value: v,
      forecastVolume: null,
    }));
    if (hist.length) {
      hist[hist.length - 1].forecastVolume = hist[hist.length - 1].value;
    }
    const fc = (forecastDataLR || []).map((pt, i) => ({
      year: Number(scoreSettings.yearNames[i]),
      value: null,
      forecastVolume: pt.forecastVolume,
    }));
    return [...hist, ...fc];
  }, [historicalVolumes, forecastDataLR, chartData, scoreSettings.yearNames]);

  // ─── Combine historical + score‐based forecast ────────────────────────────
  const combinedDataScore = useMemo(() => {
    if (!chartData.length) return [];
    const hist = historicalVolumes.map((v, i) => ({
      year: Number(chartData[i].year),
      value: v,
      forecastVolume: null,
    }));
    if (hist.length) {
      hist[hist.length - 1].forecastVolume = hist[hist.length - 1].value;
    }
    const fc = forecastDataScore.map((pt, i) => ({
      year: Number(scoreYearNames[i]),
      value: null,
      forecastVolume: pt.forecastVolume,
    }));
    return [...hist, ...fc];
  }, [chartData, historicalVolumes, forecastDataScore, scoreYearNames]);

  //Selected Graph initialization
  const selectedGraph = graphs.find((g) => g.id === selectedGraphId);
  const { ai_forecast: aiForecast = {}, race_forecast: raceForecast = {} } =
    selectedGraph || {};

  // right after you destructure aiForecast & raceForecast
  const bothData = useMemo(() => {
    if (!chartData.length) return [];

    // 1) build the historical rows
    const hist = chartData.map((row, i) => ({
      year: Number(row.year),
      value: historicalVolumes[i],
      forecastLinear: null,
      forecastScore: null,
      forecastAI: null,
      forecastRace: null,
    }));

    // 2) carry last actual value into the “0th” forecast point
    if (hist.length) {
      const last = hist[hist.length - 1];
      last.forecastLinear = last.value;
      last.forecastScore = last.value;
      last.forecastAI = last.value;
      last.forecastRace = last.value;
    }

    // 3) single unified slice for all forecasts
    const fc = (scoreSettings.yearNames || []).map((yr, i) => ({
      year: Number(yr),
      value: null,
      forecastLinear: forecastDataLR[i]?.forecastVolume ?? null,
      forecastScore: forecastDataScore[i]?.forecastVolume ?? null,
      forecastAI: aiForecast[yr] ?? null,
      forecastRace: raceForecast[yr] ?? null,
    }));

    return [...hist, ...fc];
  }, [
    chartData,
    historicalVolumes,
    forecastDataLR,
    forecastDataScore,
    scoreSettings.yearNames,
    aiForecast,
    raceForecast,
  ]);

// ─── Compute CAGR‐style growth for each series ──────────────────────────
  const growthRates = useMemo(() => {
    const histCount = chartData.length;
    if (!bothData.length || histCount < 2) return {};
 
    // 1) Compute historical CAGR
    const firstHist = historicalVolumes[0];
    const lastHist = historicalVolumes[histCount - 1];
    const periodsHist = histCount - 1;
 
    const calcCAGR = (start, end, periods) =>
      start != null && end != null && periods > 0
        ? (Math.pow(end / start, 1 / periods) - 1) * 100
        : null;
 
    const historical = calcCAGR(firstHist, lastHist, periodsHist);
 
    // 2) Now slice off the unified forecast block
    const fc = bothData.slice(histCount);
    if (fc.length < 2) {
      return { historical };
    }
 
    const firstFc = fc[0];
    const lastFc = fc[fc.length - 1];
    const periodsFc = fc.length - 1;
 
    return {
      historical,
      linear: calcCAGR(
        firstFc.forecastLinear,
        lastFc.forecastLinear,
        periodsFc
      ),
      score: calcCAGR(firstFc.forecastScore, lastFc.forecastScore, periodsFc),
      ai: calcCAGR(firstFc.forecastAI, lastFc.forecastAI, periodsFc),
      race: calcCAGR(firstFc.forecastRace, lastFc.forecastRace, periodsFc),
    };
  }, [bothData, chartData.length, historicalVolumes]);

  // ─── Color palette ─────────────────────────────────────────────────────────
  const PALETTE = [
    { light: "#15AFE4", dark: "#0D7AAB" },
    { light: "#FFC107", dark: "#B38600" },
    { light: "#23DD1D", dark: "#149A11" },
    { light: "#38CCD4", dark: "#1F7F84" },
    { light: "#A17CFF", dark: "#5E3DBD" },
    { light: "#FF8A65", dark: "#C75B39" },
    { light: "#85FF8C", dark: "#50AA5B" },
    { light: "#FF92E3", dark: "#C25AA8" },
  ];
  const getColor = (i) => PALETTE[i % PALETTE.length].light;
  const getDark = (i) => PALETTE[i % PALETTE.length].dark;

  // ─── Legend payload for line charts ───────────────────────────────────────

  const legendPayload = useMemo(() => {
    const items = [{ value: "Historical", type: "line", color: "#D64444" }];
    if (selectedGraph?.forecast_types?.includes("linear")) {
      items.push({
        value: "Forecast (Stats)",
        type: "line",
        color: "#F58C1F",
      });
    }
    if (selectedGraph?.forecast_types?.includes("score")) {
      items.push({
        value: "Forecast (Survey-based)",
        type: "line",
        color: "#23DD1D",
      });
    }
    if (Object.keys(aiForecast).length) {
      items.push({ value: "Forecast (AI)", type: "line", color: "#A17CFF" });
    }
    if (Object.keys(raceForecast).length) {
      items.push({ value: "Forecast (Race)", type: "line", color: "#FF8A65" });
    }

    return items;
  }, [selectedGraph]);

  // ─── Custom tooltip component ─────────────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const fmt = (v) =>
      typeof v === "number"
        ? v.toLocaleString(undefined, { maximumFractionDigits: 0 })
        : v;
    return (
      <>
        <div className="tooltip-card">
          <p>{label}</p>
          {payload.map((p) => (
            <div key={p.dataKey}>
              <span className="dot" style={{ background: p.color }} />
              {p.name}: {fmt(p.value)}
            </div>
          ))}
        </div>
        <style jsx>{`
          .tooltip-card {
            background: rgba(20, 20, 20, 0.9);
            padding: var(--space-sm);
            border-radius: var(--radius);
            box-shadow: var(--shadow-deep);
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.875rem;
          }
          .tooltip-card .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 4px;
            display: inline-block;
          }
        `}</style>
      </>
    );
  };

  // ─── Y-axis formatter ───────────────────────────────────────────────────────
  const abbreviate = (v) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
    return v.toString();
  };

  // ─── When `displayRegions` changes, reset `openRegions` ───────────────────
  useEffect(() => {
    const init = {};
    displayRegions.forEach((r) => {
      init[r.id] = false;
    });
    setOpenRegions(init);
  }, [displayRegions]);

  // console.log("selectedCountriesList" , selectedCountriesList);
  // console.log("availableGraphs " , availableGraphs);
  // console.log("selectedgraphid ", selectedGraphId);
  // console.log("graphs ", graphs);
  // console.log("volumedatamap ", volumeDataMap);
  // console.log("forecastDataLR ", forecastDataLR);
  // console.log("selected Dataset ", selectedDataset);
  // console.log("chartdata ", chartData);
  // console.log("combineddata" , combinedData);
  console.log("bothdata ", bothData);
  console.log("pie data ", pieData);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="forecast-wrapper">
      <GlobalStyles />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="container-fluid"
        style={{ background: "#2C2E31" }}
      >
        <div className="container">
          {/* ─── APP HEADER ─────────────────────────────────────────── */}
          <div className="app-header d-flex justify-content-between align-items-center">
            <Link href="/" passHref>
              <motion.div
                className="logo-container"
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
                onClick={() => router.push("/")}
                animate={{
                  scale: isLogoHover ? 1.05 : 1,
                  filter: isLogoHover
                    ? "drop-shadow(0 0 12px var(--accent, #FFDC00)) brightness(1.2) saturate(1.3)"
                    : "none",
                }}
                transition={{
                  scale: { type: "spring", stiffness: 300, damping: 20 },
                  filter: { duration: 0.2 },
                }}
              >
                <Image
                  src="/images/race analytics new logo white.png"
                  alt="Race Auto India"
                  width={Math.round(160 * 1.5)}
                  height={Math.round(60 * 1.5)}
                />
              </motion.div>
            </Link>

            <div className="nav-buttons">
              {/* ─── Exclusive Services Dropdown Next to Logo ───────────────────── */}
              <div className="exclusive-services-dropdown dropdown forecast-dropdown ms-3">
                <button
                  className="forecast-navbar-btn dropdown-toggle"
                  data-bs-toggle="dropdown"
                >
                  Exclusive Services
                </button>
                <ul className="dropdown-menu dropdown-menu-dark">
                  {/* Submenu: Key Market Indicators */}
                  <li>
                    <a
                      className="dropdown-item"
                      href="mailto:info@raceautoindia.com,director@raceautoindia.com?subject=Forecast%20Page%20Request%20-%20Key%20Market%20Indicators&body=Hello%2C%0D%0A%0D%0AThis%20request%20is%20made%20from%20the%20Forecast%20Page%20of%20Race%20Auto%20India.%0D%0AI%20would%20like%20to%20receive%20the%20latest%20Key%20Market%20Indicators.%0D%0AThank%20you."
                    >
                      Key Market Indicators
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="mailto:info@raceautoindia.com,director@raceautoindia.com?subject=Forecast%20Page%20Request%20-%20Global%20Comparisons&body=Hi%2C%0D%0A%0D%0ARequest%20made%20from%20the%20Forecast%20Page.%20I%20am%20interested%20in%20Global%20Comparison%20data.%0D%0ARegards."
                    >
                      Global Comparisons
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="mailto:info@raceautoindia.com,director@raceautoindia.com?subject=Forecast%20Page%20Request%20-%20Market%20Highlights&body=Dear%20Team%2C%0D%0A%0D%0AThis%20is%20a%20request%20from%20the%20Forecast%20Page.%20Please%20share%20the%20latest%20market%20highlights.%0D%0AThank%20you."
                    >
                      Highlights
                    </a>
                  </li>

                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  {/* Submenu: Analyst Opinion */}
                  <li className="dropdown-submenu px-2">
                    <span className="dropdown-item-text text-muted small">
                      Analyst Opinion
                    </span>
                    <ul className="list-unstyled ps-3">
                      <li>
                        <a
                          className="dropdown-item"
                          href="mailto:info@raceautoindia.com,director@raceautoindia.com?subject=Forecast%20Page%20Request%20-%20Book%20Analyst%20Appointment&body=Hello%2C%0D%0A%0D%0AI%20am%20requesting%20an%20appointment%20with%20an%20analyst%20via%20the%20Forecast%20Page.%0D%0ARegards."
                        >
                          Book an Appointment
                        </a>
                      </li>
                      <li>
                        <a
                          className="dropdown-item"
                          href="mailto:info@raceautoindia.com,director@raceautoindia.com?subject=Forecast%20Page%20Request%20-%20Submit%20a%20Query&body=Hi%20Team%2C%0D%0A%0D%0AI%20have%20a%20market-related%20query%20from%20the%20Forecast%20Page.%0D%0ARegards."
                        >
                          Send Your Queries
                        </a>
                      </li>
                    </ul>
                  </li>

                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  {/* Submenu: Reports */}
                  <li className="dropdown-submenu px-2">
                    <span className="dropdown-item-text text-muted small">
                      Reports
                    </span>
                    <ul className="list-unstyled ps-3">
                      <li>
                        <a
                          className="dropdown-item"
                          href="mailto:info@raceautoindia.com,director@raceautoindia.com?subject=Forecast%20Page%20Request%20-%20Sample%20Report&body=Dear%20Team%2C%0D%0A%0D%0ARequest%20from%20the%20Forecast%20Page%20to%20receive%20a%20sample%20report.%0D%0AThanks."
                        >
                          Sample Reports on Demand
                        </a>
                      </li>
                      <li>
                        <a
                          className="dropdown-item"
                          href="mailto:info@raceautoindia.com,director@raceautoindia.com?subject=Forecast%20Page%20Request%20-%20Full%20Report%20Purchase&body=Hi%2C%0D%0A%0D%0AI%20want%20to%20purchase%20a%20full%20market%20report%20via%20the%20Forecast%20Page.%20Please%20send%20pricing%20and%20access%20details.%0D%0AThanks."
                        >
                          Purchase Full Report on Demand
                        </a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              <button
                className="nav-btn"
                onClick={() => router.push("/score-card")}
              >
                <FaClipboardList className="btn-icon" />
                Build Your Own Tailored Forecast
              </button>
              <button
                className="nav-btn"
                onClick={() => router.push("/flash-reports")}
              >
                <FaBolt className="btn-icon" />
                Flash Reports
              </button>
            </div>
          </div>

          {/* ─── 1) Category picker ──────────────────────────────────── */}
          <div className="selectors d-flex align-items-center gap-3">
            <div
              className={`dropdown-toggle ${
                isDatasetHovering ? "dropdown-open" : ""
              }`}
              onMouseEnter={() => setIsDatasetHovering(true)}
              onMouseLeave={() => setIsDatasetHovering(false)}
            >
              <span style={{ color: "white" }}>
                {selectedCategoryId
                  ? hierarchyMap[selectedCategoryId]
                  : "Category"}
              </span>
              <div
                className={`chart-dropdown ${isDatasetHovering ? "open" : ""}`}
              >
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setSelectedRegionId(null);
                      setSelectedGraphId(null);
                    }}
                    className="mt-1"
                    style={{
                      cursor: "pointer",
                      color:
                        selectedCategoryId === cat.id
                          ? "var(--accent-active)"
                          : "white",
                    }}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── 2) Regions/Countries picker ───────────────────────── */}
            {selectedCategoryId && (
              <div
                className={`dropdown-toggle ${
                  isRegionsHovering ? "dropdown-open" : ""
                }`}
                onMouseEnter={() => setIsRegionsHovering(true)}
                onMouseLeave={() => setIsRegionsHovering(false)}
              >
                <span style={{ color: "white" }}>
                  {selectedRegionId
                    ? hierarchyMap[selectedRegionId]
                    : "Regions"}
                </span>
                <div
                  className={`chart-dropdown ${
                    isRegionsHovering ? "open" : ""
                  }`}
                >
                  {/* “All Regions” checkbox */}
                  {allRegionsNode && (
                    <label
                      className="d-flex align-items-center mt-1"
                      style={{ cursor: "pointer", color: "white" }}
                    >
                      <input
                        type="checkbox"
                        className="me-2"
                        checked={selectedRegionId === allRegionsNode.id}
                        onChange={() => {
                          if (selectedRegionId === allRegionsNode.id) {
                            setSelectedRegionId(null);
                          } else {
                            setSelectedRegionId(allRegionsNode.id);
                            setSelectedGraphId(null);
                          }
                        }}
                      />
                      {allRegionsNode.name}
                    </label>
                  )}

                  {/* Individual regions with expandable country lists */}
                  {displayRegions.map((region) => {
                    const children = countriesByRegion[region.id] || [];
                    const isOpen = openRegions[region.id];
                    return (
                      <div
                        key={region.id}
                        style={{ marginBottom: 8, color: "white" }}
                      >
                        <label
                          className="d-flex align-items-center"
                          style={{ cursor: "pointer" }}
                        >
                          <strong
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenRegions((prev) => ({
                                ...prev,
                                [region.id]: !prev[region.id],
                              }));
                            }}
                            style={{ userSelect: "none", width: "100%" }}
                          >
                            {region.name} {isOpen ? "▾" : "▸"}
                          </strong>
                        </label>

                        {isOpen &&
                          children.map((cn) => (
                            <label
                              key={cn.id}
                              className="d-block ps-3"
                              style={{
                                fontSize: 14,
                                marginTop: 4,
                                color: "white",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                className="me-2"
                                checked={selectedRegionId === cn.id}
                                onChange={() => {
                                  if (selectedRegionId === cn.id) {
                                    setSelectedRegionId(null);
                                  } else {
                                    setSelectedRegionId(cn.id);
                                    setSelectedGraphId(null);
                                  }
                                }}
                              />
                              {cn.name}
                            </label>
                          ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ─── 3) Graph picker ────────────────────────────────────────────── */}
          <div className="mt-2">
            {selectedCountriesList.length > 0 && (
              <h5 className="chart-header">
                <div
                  className={`dropdown-toggle ${
                    isHovering ? "dropdown-open" : ""
                  }`}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <span className="chart-title">
                    {availableGraphs.find((g) => g.id === selectedGraphId)
                      ?.name || "Select a graph"}
                  </span>
                  <div className={`chart-dropdown ${isHovering ? "open" : ""}`}>
                    {availableGraphs.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedGraphId(opt.id)}
                        className="mt-1"
                        style={{
                          cursor: "pointer",
                          color:
                            selectedGraphId === opt.id
                              ? "var(--accent-active)"
                              : "white",
                        }}
                      >
                        {opt.name}
                      </div>
                    ))}
                  </div>
                </div>
              </h5>
            )}
          </div>

          {/* ─── 4) Chart area ──────────────────────────────────────────────────── */}
          <div className="mt-3">
            {loading ? (
              <div className="skeleton-line" />
            ) : !selectedGraphId ? (
              <p className="text-center text-white">
                Please choose a category, select a region/country or “All
                Regions,” then pick a graph.
              </p>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedGraphId}-${selectedRegionId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="chart-card" style={{ position: "relative" }}>
                    <div className="growth-block mb-1 text-center">
                      <div className="growth-header">Growth Rates (CAGR%)</div>
                      <div className="growth-rates d-flex justify-content-center gap-4">
                        {growthRates.historical != null && (
                          <div className="rate-item">
                            <span
                              className="dot"
                              style={{ background: "#D64444" }}
                            />
                            {growthRates.historical.toFixed(1)}% Historical
                          </div>
                        )}
                        {growthRates.linear != null && (
                          <div className="rate-item">
                            <span
                              className="dot"
                              style={{ background: "#F58C1F" }}
                            />
                            {growthRates.linear.toFixed(1)}% Forecast (Stats)
                          </div>
                        )}
                        {growthRates.score != null && (
                          <div className="rate-item">
                            <span
                              className="dot"
                              style={{ background: "#23DD1D" }}
                            />
                            {growthRates.score.toFixed(1)}% Forecast (Survey)
                          </div>
                        )}
                        {growthRates.ai != null && (
                          <div className="rate-item">
                            <span
                              className="dot"
                              style={{ background: "#A17CFF" }}
                            />
                            {growthRates.ai.toFixed(1)}% Forecast (AI)
                          </div>
                        )}
                        {growthRates.race != null && (
                          <div className="rate-item">
                            <span
                              className="dot"
                              style={{ background: "#FF8A65" }}
                            />
                            {growthRates.race.toFixed(1)}% Forecast (Race)
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 65,
                        display: "flex",
                        alignItems: "center",
                        pointerEvents: "none",
                        zIndex: 10,
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          fontSize: "0.75rem",
                          marginRight: "4px",
                          fontFamily: "inherit",
                        }}
                      >
                        Powered by
                      </span>
                    </div>
                    <Image
                        src="/images/Ri-Logo-Graph-White.png"
                        alt="Race Innovations"
                        width={33}
                        height={50}
                        style={{
                          position: "absolute",
                          top: 15,
                          right: 25,
                          opacity: 1,
                          pointerEvents: "none",
                        }}
                      />

                    <ResponsiveContainer
                      width="100%"
                      height={400}
                      style={{ borderLeft: 10 }}
                    >
                      {(() => {
                        if (!selectedGraph) return null;
                        if (selectedGraph.chart_type === "line") {
                          const hasLinear =
                            selectedGraph.forecast_types?.includes("linear");
                          const hasScore =
                            selectedGraph.forecast_types?.includes("score");

                          // Determine which data array to plot
                          const dataToPlot =
                            hasLinear && hasScore
                              ? bothData
                              : hasLinear
                              ? combinedData
                              : hasScore
                              ? combinedDataScore
                              : chartData;

                          return (
                            <LineChart
                              data={dataToPlot}
                              margin={{
                                top: 20,
                                right: 20,
                                bottom: 0,
                                left: 10,
                              }}
                              animationDuration={2500}
                              animationEasing="ease-out"
                            >
                              <image
                                href="/images/chart-background-race-auto-logo.png" // Adjust path as needed
                                x="38%"
                                y="8%"
                                width="300"
                                height="300"
                                opacity="0.04"
                                // transform="rotate(-20)"
                              />
                              <defs>
                                <linearGradient
                                  id="histGrad"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor={
                                      hasLinear && hasScore
                                        ? "#D64444"
                                        : "#1039EE"
                                    }
                                    stopOpacity={0.9}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor={
                                      hasLinear && hasScore
                                        ? "#D64444"
                                        : "#1039EE"
                                    }
                                    stopOpacity={0.3}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                stroke="rgba(255,255,255,0.1)"
                                strokeDasharray="3 3"
                              />
                              <XAxis
                                dataKey="year"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                  fill: "rgba(255,255,255,0.7)",
                                  fontSize: 12,
                                }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#FFC107", fontSize: 12 }}
                                domain={["auto", "auto"]}
                                tickFormatter={abbreviate}
                              />
                              <Brush
                                dataKey="year"
                                height={12}
                                stroke="rgba(255,255,255,0.4)"
                                fill="rgba(255,255,255,0.08)"
                                strokeWidth={1}
                                tickFormatter={(d) => d}
                                tick={{
                                  fill: "rgba(255,255,255,0.6)",
                                  fontSize: 9,
                                  fontFamily: "inherit",
                                }}
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
                              <Tooltip content={<CustomTooltip />} />
                              <Legend
                                wrapperStyle={{ marginTop: 24 }}
                                payload={legendPayload}
                              />
                              <Line
                                dataKey="value"
                                name="Historical"
                                stroke="url(#histGrad)"
                                strokeWidth={3}
                                connectNulls
                                animationBegin={0}
                              />
                              {hasLinear && (
                                <Line
                                  dataKey={
                                    hasLinear && hasScore
                                      ? "forecastLinear"
                                      : "forecastVolume"
                                  }
                                  name="Forecast (Stats)"
                                  stroke="#F58C1F"
                                  strokeWidth={2}
                                  strokeDasharray="5 5"
                                  connectNulls
                                  animationBegin={150}
                                />
                              )}
                              {hasScore && (
                                <Line
                                  dataKey={
                                    hasLinear && hasScore
                                      ? "forecastScore"
                                      : "forecastVolume"
                                  }
                                  name="Forecast (Survey-based)"
                                  stroke="#23DD1D"
                                  strokeWidth={2}
                                  strokeDasharray="2 2"
                                  connectNulls
                                  animationBegin={300}
                                />
                              )}
                              {aiForecast && (
                                <Line
                                  dataKey="forecastAI"
                                  name="Forecast (AI)"
                                  stroke="#A17CFF"
                                  strokeWidth={2}
                                  strokeDasharray="4 4"
                                  connectNulls
                                  animationBegin={450}
                                />
                              )}
                              {raceForecast && (
                                <Line
                                  dataKey="forecastRace"
                                  name="Forecast (Race)"
                                  stroke="#FF8A65"
                                  strokeWidth={2}
                                  strokeDasharray="2 4"
                                  connectNulls
                                  animationBegin={600}
                                />
                              )}
                            </LineChart>
                          );
                        }

                        if (selectedGraph.chart_type === "bar") {
                          const barCount = chartData.length;
                          const maxBarSize =
                            barCount < 5 ? 100 : barCount < 10 ? 60 : 24;
                          const barCategoryGap =
                            barCount < 5 ? 40 : barCount < 10 ? 24 : 16;

                          return (
                            <BarChart
                              data={chartData}
                              margin={{
                                top: 20,
                                right: 20,
                                bottom: 20,
                                left: 30,
                              }}
                              barCategoryGap={barCategoryGap}
                              maxBarSize={maxBarSize}
                            >
                              <CartesianGrid
                                stroke="rgba(255,255,255,0.05)"
                                strokeDasharray="3 3"
                              />

                              <XAxis
                                dataKey="year"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                  fill: "rgba(255,255,255,0.6)",
                                  fontSize: 12,
                                }}
                                padding={{ left: 10, right: 10 }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                  fill: "rgba(255,255,255,0.6)",
                                  fontSize: 12,
                                }}
                              />

                              <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: "rgba(255,255,255,0.08)" }}
                              />
                              {/* <Legend
                                wrapperStyle={{
                                  color: "rgba(255,255,255,0.7)",
                                  marginTop: 16,
                                }}
                                iconType="circle"
                              /> */}

                              <defs>
                                <linearGradient
                                  id="grad-0"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor={getColor(0)}
                                    stopOpacity={0.8}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor={getDark(0)}
                                    stopOpacity={0.3}
                                  />
                                </linearGradient>
                              </defs>

                              <Bar
                                dataKey="data"
                                fill="url(#grad-0)"
                                radius={[6, 6, 0, 0]}
                                className="premium-bar"
                              />
                            </BarChart>
                          );
                        }

                        // Otherwise, pie chart
                        return (
                          <PieChart>
                            <defs>
                              {pieData.map((_, i) => (
                                <linearGradient
                                  key={i}
                                  id={`sliceGrad-${i}`}
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor={getColor(i)}
                                    stopOpacity={0.8}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor={getDark(i)}
                                    stopOpacity={0.3}
                                  />
                                </linearGradient>
                              ))}
                            </defs>

                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={110}
                              paddingAngle={4}
                              stroke="rgba(255,255,255,0.1)"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {pieData.map((_, i) => (
                                <Cell key={i} fill={`url(#sliceGrad-${i})`} />
                              ))}
                            </Pie>

                            <Tooltip
                              content={<CustomTooltip />}
                              cursor={false}
                            />
                            <Legend
                              verticalAlign="bottom"
                              align="center"
                              iconType="circle"
                              wrapperStyle={{
                                color: "rgba(255,255,255,0.7)",
                                marginTop: 16,
                              }}
                            />
                          </PieChart>
                        );
                      })()}
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div style={{ height: ".75rem" }} />
          <Footer />
        </div>
      </motion.div>
    </div>
  );
}

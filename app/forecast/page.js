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
import { useCurrentPlan } from "../hooks/useCurrentPlan";
import LoginNavButton from "../flash-reports/components/Login/LoginAuthButton";

export default function ForecastPage() {
  const { planName, email, loading: planLoading } = useCurrentPlan();
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

  //user country selection
  const [userCountry, setUserCountry] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [countries, setCountries] = useState([]);
  const [chosenCountry, setChosenCountry] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  //admin access
  // ─── Add these just below your other useState calls ─────────────────
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState("");
  let pressTimer = null;

  useEffect(() => {
    if (planLoading || !email) return;
    // 1) load user‐country
    fetch(`/api/user-country?email=${encodeURIComponent(email)}`)
      .then((res) => {
        if (res.status === 404 && planName !== "silver") {
          setModalOpen(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUserCountry(data);
          setChosenCountry(data.country_id);
        }
      })
      .catch(console.error);

    // 2) load list of available countries
    fetch("/api/availableCountries")
      .then((res) => res.json())
      .then(setCountries)
      .catch(console.error);
  }, [planLoading, email]);

  useEffect(() => {
    if (!email || !userCountry) return;
    fetch("/api/user-country", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        plan_name: planName,
        country_id: userCountry.country_id,
      }),
    }).catch(console.error);
  }, [planName, email, userCountry]);

  // just after your existing useState calls
  const chosenCountryName = useMemo(() => {
    const country = countries.find((c) => c.id === chosenCountry);
    return country ? country.name : "";
  }, [countries, chosenCountry]);

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

  // if Silver, drop any selectedCategoryId ≥ index 2
  useEffect(() => {
    if (planName === "silver" && !isAdmin && selectedCategoryId != null) {
      const idx = categories.findIndex((c) => c.id === selectedCategoryId);
      if (idx >= 2) {
        setSelectedCategoryId(null);
        setSelectedRegionId(null);
        setSelectedGraphId(null);
      }
    }
  }, [planName, categories, selectedCategoryId, isAdmin]);

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

  // ─── 5.1) Flatten out all the “country” leaf nodes ─────────────────
  const allCountryNodes = useMemo(() => {
    // displayRegions are your region-level nodes:
    return displayRegions.flatMap((region) =>
      contentHierarchyNodes.filter((node) => node.parent_id === region.id)
    );
  }, [displayRegions, contentHierarchyNodes]);

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

  //Auto-select that country for Gold & Platinum
  useEffect(() => {
    // Only for gold/platinum, once we know the modal‐chosen name + allCountryNodes
    if (
      (planName === "gold" || planName === "platinum") &&
      chosenCountryName &&
      allCountryNodes.length
    ) {
      const match = allCountryNodes.find(
        (node) => node.name === chosenCountryName
      );
      if (match) {
        // match.id is the contentHierarchy ID of the country leaf node
        setSelectedRegionId(match.id);
      }
    }
  }, [planName, chosenCountryName, allCountryNodes]);

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
    console.log("data", data);

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

  // ─── Build barChartData for stacked bars ─────────────────────────────
  const barChartData = useMemo(() => {
    if (!selectedDataset?.data) return [];
    const segments = Object.keys(selectedDataset.data); // e.g. ["2WD …", "4WD …", …]
    // assume every segment has the same years
    const years = Object.keys(selectedDataset.data[segments[0]]).sort();
    return years.map((year) => {
      const row = { year };
      segments.forEach((seg) => {
        row[seg] = selectedDataset.data[seg][year] ?? 0;
      });
      return row;
    });
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
    // console.log("chartdata ", chartData);
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
      forecastVolume: pt?.forecastVolume,
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

  // compute once, outside the component or at top of component
  const lastHistYear = chartData.length
    ? Number(chartData[chartData.length - 1].year)
    : null;

  // ─── Custom tooltip component ─────────────────────────────────────────────
  const CustomTooltip = ({ active, payload, label, chartType }) => {
    if (!active || !payload?.length) return null;

    const fmt = (v) =>
      typeof v === "number"
        ? v.toLocaleString(undefined, { maximumFractionDigits: 0 })
        : v;

    // for line charts you keep your existing logic…
    if (chartType !== "bar") {
      const year = Number(label);
      const isHistorical = lastHistYear !== null && year <= lastHistYear;
      payload = payload.filter((p) =>
        isHistorical ? p.dataKey === "value" : p.dataKey !== "value"
      );
      if (!payload.length) return null;
    }

    return (
      <div className="tooltip-card">
        <p>{label}</p>
        {payload.map((p) => (
          <div key={p.dataKey}>
            <span className="dot" style={{ background: p.color }} />
            {p.name}: {fmt(p.value)}
          </div>
        ))}
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
      </div>
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
  console.log("chartdata ", chartData);
  // console.log("combineddata" , combinedData);
  // console.log("bothdata ", bothData);
  // console.log("pie data ", pieData);
  // console.log("selected graph ", selectedGraph);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
    
    
    <div className="forecast-wrapper">
      
      {adminModalOpen && (
        <motion.div className="modal-overlay admin-modal-overlay">
          <motion.div className="modal-card admin-modal-card">
            <h2>Admin Passkey</h2>
            <input
              type="password"
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              placeholder="Enter secret key"
              style={{
                width: "100%",
                padding: ".5rem",
                margin: "1rem 0",
                background: "#333",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: ".5rem",
              }}
            >
              <button
                onClick={() => {
                  setAdminModalOpen(false);
                  setAdminKeyInput("");
                }}
              >
                Cancel
              </button>
              <button
                disabled={!adminKeyInput}
                onClick={() => {
                  if (adminKeyInput === "imThe8055") {
                    setIsAdmin(true);
                    setAdminModalOpen(false);
                  } else {
                    alert("Wrong passkey");
                  }
                  setAdminKeyInput("");
                }}
              >
                Unlock
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {modalOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {!confirmationOpen ? (
              <>
                <h2>Select Your Country</h2>
                <select
                  value={chosenCountry || ""}
                  onChange={(e) => setChosenCountry(Number(e.target.value))}
                >
                  <option value="" disabled>
                    — pick one —
                  </option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!chosenCountry}
                  onClick={() => setConfirmationOpen(true)}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <h2
                  style={{
                    color: "#FFCC00",
                    marginBottom: "0.5rem",
                    fontSize: "1.5rem",
                    textShadow: "0 0 4px rgba(255,204,0,0.7)",
                  }}
                >
                  ⚠️ Confirm Selection
                </h2>
                <p
                  style={{
                    color: "#ddd",
                    lineHeight: 1.4,
                    marginBottom: "1.25rem",
                    fontSize: "0.95rem",
                  }}
                >
                  You’ve chosen{" "}
                  <strong style={{ color: "white" }}>
                    {countries.find((c) => c.id === chosenCountry)?.name}
                  </strong>
                  . This cannot be changed later. Please type the country name
                  below to confirm.
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type country name exactly"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    marginBottom: "1rem",
                    background: "#333",
                    border: "1px solid #555",
                    borderRadius: "6px",
                    color: "white",
                    fontSize: "1rem",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    onClick={() => {
                      setConfirmationOpen(false);
                      setConfirmText("");
                    }}
                    style={{
                      padding: "0.6rem 1.2rem",
                      background: "transparent",
                      border: "1px solid #777",
                      borderRadius: "5px",
                      color: "#ccc",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={
                      confirmText.trim().toLowerCase() !==
                      countries
                        .find((c) => c.id === chosenCountry)
                        ?.name.toLowerCase()
                    }
                    onClick={() => {
                      fetch("/api/user-country", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email,
                          plan_name: planName,
                          country_id: chosenCountry,
                        }),
                      })
                        .then(() => {
                          setUserCountry({
                            email,
                            plan_name: planName,
                            country_id: chosenCountry,
                          });
                          setModalOpen(false);
                        })
                        .catch(console.error);
                    }}
                    style={{
                      padding: "0.6rem 1.2rem",
                      background: "var(--accent)",
                      border: "none",
                      borderRadius: "5px",
                      color: "#222",
                      fontWeight: "600",
                      cursor:
                        confirmText.trim().toLowerCase() ===
                        countries
                          .find((c) => c.id === chosenCountry)
                          ?.name.toLowerCase()
                          ? "pointer"
                          : "not-allowed",
                      opacity:
                        confirmText.trim().toLowerCase() ===
                        countries
                          .find((c) => c.id === chosenCountry)
                          ?.name.toLowerCase()
                          ? 1
                          : 0.5,
                      fontSize: "0.9rem",
                    }}
                  >
                    OK
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
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
                onMouseLeave={() => {
                  setLogoHover(false);
                  clearTimeout(pressTimer);
                }}
                onMouseDown={() => {
                  pressTimer = setTimeout(() => setAdminModalOpen(true), 2000);
                }}
                onMouseUp={() => clearTimeout(pressTimer)}
                onTouchStart={() => {
                  pressTimer = setTimeout(() => setAdminModalOpen(true), 2000);
                }}
                onTouchEnd={() => clearTimeout(pressTimer)}
                onClick={() => {
                  // only navigate on a normal click
                  if (pressTimer !== null) router.push("/");
                }}
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
              <LoginNavButton/>
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
                {categories.map((cat, idx) => {
                  const locked = !isAdmin && planName === "silver" && idx >= 2;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        if (locked) return;
                        setSelectedCategoryId(cat.id);
                        setSelectedRegionId(null);
                        setSelectedGraphId(null);
                      }}
                      className={`mt-1 ${locked ? "locked has-tooltip" : ""}`}
                      data-tooltip={
                        locked
                          ? "Upgrade to Gold or Platinum to unlock"
                          : undefined
                      }
                      style={{
                        color: locked
                          ? "#888"
                          : selectedCategoryId === cat.id
                          ? "var(--accent-active)"
                          : "white",
                      }}
                    >
                      {cat.name}
                    </div>
                  );
                })}
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
                    const isSilverRestricted =
                      planName === "silver" && !isAdmin;

                    return (
                      <div
                        key={region.id}
                        style={{ marginBottom: 8, color: "white" }}
                      >
                        <label
                          className="d-flex align-items-center"
                          style={{
                            cursor: isSilverRestricted
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          <strong
                            onClick={(e) => {
                              if (isSilverRestricted) return;
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
                          children.map((cn) => {
                            const isGoldOrPlat =
                              planName === "gold" || planName === "platinum";
                            const disabled =
                              !isAdmin &&
                              isGoldOrPlat &&
                              cn.name !== chosenCountryName;

                            return (
                              <label
                                key={cn.id}
                                className="d-block ps-3"
                                style={{
                                  fontSize: 14,
                                  marginTop: 4,
                                  // make disabled labels gray & semi-transparent:
                                  color: disabled
                                    ? "rgba(255,255,255,0.4)"
                                    : "white",
                                  opacity: disabled ? 0.6 : 1,
                                  cursor: disabled ? "not-allowed" : "pointer",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="me-2"
                                  disabled={disabled}
                                  checked={selectedRegionId === cn.id}
                                  onChange={() => {
                                    if (disabled) return;
                                    setSelectedRegionId(
                                      selectedRegionId === cn.id ? null : cn.id
                                    );
                                    if (selectedRegionId !== cn.id) {
                                      setSelectedGraphId(null);
                                    }
                                  }}
                                />
                                {cn.name}
                              </label>
                            );
                          })}
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

          {/* ─── Graph summary (short) ─────────────────────────────────────── */}
          {selectedGraph?.summary && (
            <motion.p
              className="summary text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {selectedGraph.summary}
            </motion.p>
          )}

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
                          const segments = Object.keys(selectedDataset.data);

                          return (
                            <BarChart
                              data={barChartData}
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
                                content={<CustomTooltip  chartType="bar"/>}
                                cursor={{ fill: "rgba(255,255,255,0.08)" }}
                              />
                              <Legend
                                wrapperStyle={{
                                  color: "rgba(255,255,255,0.7)",
                                  marginTop: 16,
                                }}
                                iconType="circle"
                              />

                              {/* generate one gradient per segment */}
                              <defs>
                                {segments.map((seg, i) => (
                                  <linearGradient
                                    key={i}
                                    id={`grad-${i}`}
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

                              {/* one Bar per segment, all stacked */}
                              {segments.map((seg, i) => (
                                <Bar
                                  key={seg}
                                  dataKey={seg}
                                  stackId="stack1"
                                  fill={`url(#grad-${i})`}
                                  radius={[6, 6, 0, 0]}
                                  maxBarSize={maxBarSize}
                                />
                              ))}
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
                    {/* ─── Graph description (longer) ───────────────────────────────────── */}
                    {selectedGraph?.description && (
                      <div className="graph-description text-white opacity-75 mt-3">
                        {selectedGraph.description}
                      </div>
                    )}
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
    
    </>
  );
}

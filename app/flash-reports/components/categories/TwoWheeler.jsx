import dynamic from "next/dynamic";
import React from 'react';
// import ForecastChart from '../DummyAppSplit/TwoWheeler';

// import TwoWheelerOEM from "../charts/PieChart";

import TwoWheelerChart from '../charts/Piechart/PieChart'
import TwoWheelerApp from '../charts/Piechart/AppicationPiechart'
import TwoWheelerForecastChart from '../charts/LineChart/ForecastChart'
import LineChartWithTotal from '../charts/NewTestLineChart'
// import CustomPieChart from "../charts/PieChart";
// const TwoWheelerEV = dynamic(() => import("../ev/TwoWheeler-EV"), { ssr: false });
const TwoWheelerForecast = dynamic(() => import("../Forecast-chart/Twowheeler"), { ssr: false });
import './category.css'
import TwoWheelerPieChart from "../dynamic-charts/OEM_Charts/PieChart";
import TwoWheelerEV from '../dynamic-charts/ev/TwoWheeler-EV'


async function transformOverallChartData() {
  const token = "your-very-strong-random-string-here";

  const [hierarchyRes, volumeRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/contentHierarchy`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/volumeData`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),
  ]);

  const hierarchyData = await hierarchyRes.json();
  const volumeData = await volumeRes.json();

  // Step 1: Resolve hierarchy stream ID for: MAIN ROOT > flash-reports > overall
  const mainRoot = hierarchyData.find((n) => n.name.toLowerCase() === "main root");
  if (!mainRoot) return [];

  const flashReports = hierarchyData.find((n) => n.name.toLowerCase() === "flash-reports" && n.parent_id === mainRoot.id);
  if (!flashReports) return [];

  const overall = hierarchyData.find((n) => n.name.toLowerCase() === "overall" && n.parent_id === flashReports.id);
  if (!overall) return [];

  // Step 2: Collect all children of 'overall' (these are years like 2024, 2025)
  const yearNodes = hierarchyData.filter((n) => n.parent_id === overall.id);

  const result = [];

  for (const yearNode of yearNodes) {
    const year = yearNode.name;
    const monthNodes = hierarchyData.filter((n) => n.parent_id === yearNode.id);

    for (const monthNode of monthNodes) {
      const streamPath = [mainRoot.id, flashReports.id, overall.id, yearNode.id, monthNode.id].join(",");

      const matchedEntry = volumeData.find((v) => v.stream === streamPath);
      if (!matchedEntry || !matchedEntry.data) continue;

      const entry = {
        month: `${year}-${String(monthsList.indexOf(monthNode.name.toLowerCase()) + 1).padStart(2, '0')}`,
      };

      // Map volume values
      for (const [key, value] of Object.entries(matchedEntry.data)) {
        let mappedKey = key.toLowerCase().trim();
        if (mappedKey === "two wheeler") mappedKey = "2-wheeler";
        if (mappedKey === "three wheeler") mappedKey = "3-wheeler";
        entry[mappedKey] = value;
      }

      // Calculate total
      const vehicleKeys = [
        "2-wheeler",
        "3-wheeler",
        "passenger",
        "cv",
        "tractor",
        "truck",
        "bus",
      ];
      entry.total = vehicleKeys.reduce((sum, key) => sum + (entry[key] || 0), 0);

      result.push(entry);
    }
  }

  // Optional: Sort by month ascending
  result.sort((a, b) => new Date(a.month) - new Date(b.month));

  return result;

}

const monthsList = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec"
];


async function fetchTwoWheelerData() {
    const token = "your-very-strong-random-string-here";

    const [hierarchyRes, volumeRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/contentHierarchy`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/volumeData`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }),
    ]);

    const hierarchyData = await hierarchyRes.json();
    const volumeData = await volumeRes.json();

    const overallNode = hierarchyData.find(
        (n) => n.name.toLowerCase() === "overall chart"
    );
    if (!overallNode) return [];

    const buildPath = (id) => {
        const path = [];
        let current = hierarchyData.find((n) => n.id === id);
        while (current) {
            path.unshift(current.id);
            current = hierarchyData.find((n) => n.id === current.parent_id);
        }
        return path.join(",");
    };

    const streamPath = buildPath(overallNode.id);
    const matchedEntry = volumeData.find((v) => v.stream === streamPath);
    if (!matchedEntry) return [];

    const segmentData = matchedEntry.data;
    const twoWheelerKey = Object.keys(segmentData).find(
        (k) => k.toLowerCase() === "two wheeler"
    );

    if (!twoWheelerKey) return [];

    const monthValues = segmentData[twoWheelerKey];

    return Object.entries(monthValues).map(([month, value]) => ({
        month,
        value,
    }));
}



async function fetchTwoWheelerMarketShareData() {
    const token = "your-very-strong-random-string-here";

    const [hierarchyRes, volumeRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/contentHierarchy`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/volumeData`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }),
    ]);

    const hirarchydata = await hierarchyRes.json();
    const volumedata = await volumeRes.json();

    const buildPath = (id) => {
        const path = [];
        let current = hirarchydata.find((n) => n.id === id);
        while (current) {
            path.unshift(current.id);
            current = hirarchydata.find((n) => n.id === current.parent_id);
        }
        return path.join(",");
    };

    const twoWheelerNode = hirarchydata.find(
        (n) => n.name.toLowerCase().trim() === "two-wheeler"
    );
    if (!twoWheelerNode) return [];

    const marketShareNode = hirarchydata.find(
        (n) =>
            n.name.toLowerCase().trim() === "market share" &&
            n.parent_id === twoWheelerNode.id
    );
    if (!marketShareNode) return [];

    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const today = new Date();

    let currentMonthIndex = today.getMonth() - 1;
    let previousMonthIndex = currentMonthIndex - 1;
    let year = today.getFullYear();

    if (currentMonthIndex < 0) {
        currentMonthIndex = 11;
        year -= 1;
    }

    if (previousMonthIndex < 0) {
        previousMonthIndex = 11;
        year -= 1;
    }

    const currentMonth = months[currentMonthIndex];
    const previousMonth = months[previousMonthIndex];
    const lastYear = year - 1;

    const currentYearNode = hirarchydata.find(
        (n) => n.name === String(year) && n.parent_id === marketShareNode.id
    );
    const previousYearNode = hirarchydata.find(
        (n) => n.name === String(lastYear) && n.parent_id === marketShareNode.id
    );

    if (!currentYearNode || !previousYearNode) return [];

    const currentYearMonths = hirarchydata.filter((n) => n.parent_id === currentYearNode.id);
    const previousYearMonths = hirarchydata.filter((n) => n.parent_id === previousYearNode.id);

    const currentMonthNode = currentYearMonths.find((n) => n.name.toLowerCase().trim() === currentMonth);
    const previousMonthNode = currentYearMonths.find((n) => n.name.toLowerCase().trim() === previousMonth);
    const lastYearSameMonthNode = previousYearMonths.find((n) => n.name.toLowerCase().trim() === currentMonth);

    if (!currentMonthNode || !previousMonthNode || !lastYearSameMonthNode) return [];

    const merged = {};
    const nodes = [previousMonthNode, currentMonthNode, lastYearSameMonthNode];

    for (const month of nodes) {
        const stream = buildPath(month.id);
        const volumeEntry = volumedata.find((v) => v.stream === stream);
        if (!volumeEntry) continue;

        const label = month.name + (month.parent_id === previousYearNode.id ? ` ${lastYear}` : "");

        for (const [name, value] of Object.entries(volumeEntry.data.data)) {
            if (!merged[name]) merged[name] = { name };
            merged[name][label] = value;
        }
    }

    return Object.values(merged); // ✅ Format: [{ name: ..., may: ..., jun: ..., jun 2024: ... }, ...]
}





async function fetchTwoWheelerAppData() {
    const token = "your-very-strong-random-string-here";

    const [hierarchyRes, volumeRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/contentHierarchy`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/volumeData`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }),
    ]);

    const hirarchydata = await hierarchyRes.json();
    const volumedata = await volumeRes.json();


    // Helper: build stream path from node id
    const buildPath = (id) => {
        const path = [];
        let current = hirarchydata.find((n) => n.id === id);
        while (current) {
            path.unshift(current.id);
            current = hirarchydata.find((n) => n.id === current.parent_id);
        }
        return path.join(",");
    };

    // Step 1: Find 'Two Wheeler' node
    const twoWheelerNode = hirarchydata.find(
        (n) => n.name.toLowerCase() === "two-wheeler"
    );
    if (!twoWheelerNode) return [];

    // Step 2: Under 'Two Wheeler', find 'App'
    const marketShareNode = hirarchydata.find(
        (n) =>
            n.name.toLowerCase() === "app" &&
            n.parent_id === twoWheelerNode.id
    );
    if (!marketShareNode) return [];

    // Step 3: Find month nodes under 'App'
    const monthNodes = hirarchydata
        .filter((n) => n.parent_id === marketShareNode.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 1); // Last 1 months

    // Step 4: Merge data by company name
    const merged = {};

    for (const month of monthNodes) {
        const stream = buildPath(month.id);
        const volumeEntry = volumedata.find((v) => v.stream === stream);
        if (!volumeEntry) continue;

        const label = month.name;

        for (const [name, value] of Object.entries(volumeEntry.data.data)) {
            if (!merged[name]) merged[name] = { name };
            merged[name][label] = value;
        }
    }

    return Object.values(merged);

}

async function fetchTwoWheelerEVData() {
    const token = "your-very-strong-random-string-here";

    const [hierarchyRes, volumeRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/contentHierarchy`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/volumeData`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }),
    ]);

    const hirarchydata = await hierarchyRes.json();
    const volumedata = await volumeRes.json();

    // Helper: build stream path from node id
    const buildPath = (id) => {
        const path = [];
        let current = hirarchydata.find((n) => n.id === id);
        while (current) {
            path.unshift(current.id);
            current = hirarchydata.find((n) => n.id === current.parent_id);
        }
        return path.join(",");
    };

    // Step 1: Find 'Two Wheeler' node
    const twoWheelerNode = hirarchydata.find(
        (n) => n.name.toLowerCase() === "two-wheeler"
    );
    if (!twoWheelerNode) return [];

    // Step 2: Under 'Two Wheeler', find 'App'
    const marketShareNode = hirarchydata.find(
        (n) =>
            n.name.toLowerCase() === "ev" &&
            n.parent_id === twoWheelerNode.id
    );
    if (!marketShareNode) return [];

    // Step 3: Find month nodes under 'App'
    const monthNodes = hirarchydata
        .filter((n) => n.parent_id === marketShareNode.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(-2); // Last 1 months

    // Step 4: Merge data by company name
    const merged = {};

    for (const month of monthNodes) {
        const stream = buildPath(month.id);
        const volumeEntry = volumedata.find((v) => v.stream === stream);
        if (!volumeEntry) continue;

        const label = month.name;

        for (const [name, value] of Object.entries(volumeEntry.data.data)) {
            if (!merged[name]) merged[name] = { name };
            merged[name][label] = value;
        }
    }

    return Object.values(merged);
}

const TwoWheeler = async () => {
    const twoWheelerTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const twoWheelerText = await twoWheelerTextRes.json();

    const mergedData = await transformOverallChartData();
    const mergedDataMarket = await fetchTwoWheelerMarketShareData();

    const mergedDataApp = await fetchTwoWheelerAppData();
    const mergedDataEV = await fetchTwoWheelerEVData();


    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h2>
                            {twoWheelerText.twowheeler_heading || 'Two-Wheeler OEM Performance'}
                        </h2>
                        <div
                            className='category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: twoWheelerText.twowheeler || '<p>content is loading...</p>' }}
                        />
                    </div>

                    <div className='col-12 mt-3'>
                        <TwoWheelerChart segmentName="two-wheeler" segmentType='market share' />
                    </div>

                    {/* <TwoWheelerPieChart /> */}

                    {/* <div className="col-12 mt-5">
                        <div className="text-center">
                            <h4 style={{ color: "#59bea0" }}>2-Wheeler EV Electric Share Comparison</h4>
                        </div>
                        <TwoWheelerChart piedata={mergedDataEV} />
                    </div> */}
                    {/* <TwoWheelerEV/> */}
                    <div className='col-12 mt-3'>
                        {/* <TwoWheelerChart piedata={mergedDataMarket} /> */}
                        <h4 style={{ color: "#59bea0" }} className="text-center my-3">
                            Two-Wheeler EV Electric Share Comparison
                        </h4>
                        <TwoWheelerChart segmentName="two-wheeler" segmentType='ev' />

                    </div>
                    <div className="col-12">
                        <h2 className="mt-4">
                            Forecast Chart
                        </h2>
                        {/* <TwoWheelerForecast /> */}
                        <LineChartWithTotal overallData={mergedData} category='2W'/>
                        {/* <TwoWheelerForecastChart inputData={mergedData} /> */}
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Application Chart
                        </h2>
                        <TwoWheelerApp segmentName='two-wheeler' />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TwoWheeler;

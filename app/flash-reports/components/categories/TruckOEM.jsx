import dynamic from "next/dynamic";
import React from 'react';
import TruckApplication from "../application-split/Truck";
import TruckPieChart from '../charts/Piechart/PieChart'
const TruckOEMChart = dynamic(() => import("../charts/TruckOEM"), { ssr: false });
const TruckEV = dynamic(() => import("../ev/Truck-EV"), { ssr: false });
const TruckForecast = dynamic(() => import("../Forecast-chart/Truck"), { ssr: false });
import TruckOEMBarChart from '../charts/DummyStackBarTruck'
import Truck_PieChart from '../dynamic-charts/OEM_Charts/TruckPieChart'
import TwoWheelerApp from '../charts/Piechart/AppicationPiechart'
import './category.css'
import LineChartWithTotal from '../charts/NewTestLineChart'
import CVSegmentChart from "../charts/Barchart/DynamicStackbar";
import TipperTable from '../charts/TipperTable'


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

  // Step 3: Build set of 10 target months
  const now = new Date();
  const currentMonthRef = new Date(now.getFullYear(), now.getMonth() - 1); // 1 month before now

  const targetMonthsSet = new Set();
  for (let offset = -3; offset <= 6; offset++) {
    const d = new Date(currentMonthRef.getFullYear(), currentMonthRef.getMonth() + offset);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    targetMonthsSet.add(key);
  }

  const result = [];

  for (const yearNode of yearNodes) {
    const year = yearNode.name;
    const monthNodes = hierarchyData.filter((n) => n.parent_id === yearNode.id);

    for (const monthNode of monthNodes) {
      const monthIndex = monthsList.indexOf(monthNode.name.toLowerCase());
      if (monthIndex === -1) continue;

      const formattedMonth = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      if (!targetMonthsSet.has(formattedMonth)) continue;

      const streamPath = [mainRoot.id, flashReports.id, overall.id, yearNode.id, monthNode.id].join(",");

      const matchedEntry = volumeData.find((v) => v.stream === streamPath);
      if (!matchedEntry || !matchedEntry.data) continue;

      const entry = { month: formattedMonth };

      for (const [key, value] of Object.entries(matchedEntry.data)) {
        let mappedKey = key.toLowerCase().trim();
        if (mappedKey === "two wheeler") mappedKey = "2-wheeler";
        if (mappedKey === "three wheeler") mappedKey = "3-wheeler";
        entry[mappedKey] = value;
      }

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

  // Optional: sort by month ascending
  result.sort((a, b) => new Date(a.month) - new Date(b.month));

  return result;
}

const monthsList = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec"
];



async function fetchTruckData() {
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
        (k) => k.toLowerCase() === "truck"
    );

    if (!twoWheelerKey) return [];

    const monthValues = segmentData[twoWheelerKey];

    return Object.entries(monthValues).map(([month, value]) => ({
        month,
        value,
    }));
}


async function fetchTruckMarketShareData() {
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

    // Step 1: Find 'truck' node
    const twoWheelerNode = hirarchydata.find(
        (n) => n.name.toLowerCase() === "truck"
    );
    if (!twoWheelerNode) return [];

    // Step 2: Under 'truck', find 'Market Share'
    const marketShareNode = hirarchydata.find(
        (n) =>
            n.name.toLowerCase() === "market share" &&
            n.parent_id === twoWheelerNode.id
    );
    if (!marketShareNode) return [];

    // Step 3: Find month nodes under 'Market Share'
    const monthNodes = hirarchydata
        .filter((n) => n.parent_id === marketShareNode.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(-2); // Last 2 months

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



async function fetchTruckAppData() {
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

    // Step 1: Find 'truck' node
    const twoWheelerNode = hirarchydata.find(
        (n) => n.name.toLowerCase() === "truck"
    );
    if (!twoWheelerNode) return [];

    // Step 2: Under 'truck', find 'App'
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

async function fetchTruckEVData() {
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

    // Step 1: Find 'truck' node
    const twoWheelerNode = hirarchydata.find(
        (n) => n.name.toLowerCase() === "truck"
    );
    if (!twoWheelerNode) return [];

    // Step 2: Under 'truck', find 'App'
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
        .slice(-1); // Last 1 months

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

const TruckOEM = async () => {
    const twoWheelerTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const twoWheelerText = await twoWheelerTextRes.json();

    const mergedData = await transformOverallChartData();
    // const mergedDataMarket = await fetchTruckMarketShareData();
    const mergedDataApp = await fetchTruckAppData();
    // const mergdedDataEV = await fetchTruckEVData();

    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h2>
                            {twoWheelerText.truck_heading || 'Truck OEM Performance'}
                        </h2>
                        <div
                            className='category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: twoWheelerText.truck || '<p>content is loading...</p>' }}
                        />
                    </div>
                    {/* <div className='col-12 mt-3'>
    <Truck_PieChart/>
 </div> */}

                    <div className='col-12 mt-3'>
                        <TruckPieChart segmentName="truck" segmentType='market share' />
                    </div>

                    <div className='col-12 mt-3'>
                        {/* <TruckOEMChart /> */}
                        {/* <TruckPieChart /> */}
                        {/* <TruckOEMBarChart /> */}
                        <CVSegmentChart segmentName="truck" />
                    </div>

                    {/* <div className="col-12 mt-5">
                        <TruckEV />
                    </div> */}

                    <div className="col-12">
                        <h2 className="mt-4">
                            Forecast Chart
                        </h2>
                        {/* <TruckForecast /> */}
                        <LineChartWithTotal overallData={mergedData} category='Truck'/>
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Application Chart
                        </h2>
                        <TwoWheelerApp segmentName='truck' />
                    </div>
                    <TipperTable/>
                </div>
            </div>
        </div>
    );
};

export default TruckOEM;

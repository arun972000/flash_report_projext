import dynamic from "next/dynamic";
import TractorApplication from "../DummyAppSplit/Tractor";
import Tractor_EV from '../ev/Tractor_ev'
import LineChartWithTotal from '../charts/NewTestLineChart'
import TractorChart from '../charts/Piechart/PieChart'
import TractorApp from '../charts/Piechart/AppicationPiechart'

const Tractor_Piechart = dynamic(
    () => import("../charts/TractorPieChart"),
    { ssr: false }
);

import TractorForecast from '../Forecast-chart/Tractor';
import './category.css'
import Tractor_PieChart from "../dynamic-charts/OEM_Charts/TractorPieChart";


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



async function fetchTractorData() {
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
        (k) => k.toLowerCase() === "tractor"
    );

    if (!twoWheelerKey) return [];

    const monthValues = segmentData[twoWheelerKey];

    return Object.entries(monthValues).map(([month, value]) => ({
        month,
        value,
    }));
}


async function fetchTractorMarketShareData() {
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

    // Step 1: Find 'tractor' node
    const twoWheelerNode = hirarchydata.find(
        (n) => n.name.toLowerCase() === "tractor"
    );
    if (!twoWheelerNode) return [];

    // Step 2: Under 'tractor', find 'Market Share'
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


async function fetchTractorAppData() {
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

    // Step 1: Find 'tractor' node
    const twoWheelerNode = hirarchydata.find(
        (n) => n.name.toLowerCase() === "tractor"
    );
    if (!twoWheelerNode) return [];

    // Step 2: Under 'tractor', find 'App'
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

async function fetchTractorEVData() {
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

    // Step 1: Find 'tractor' node
    const twoWheelerNode = hirarchydata.find(
        (n) => n.name.toLowerCase() === "tractor"
    );
    if (!twoWheelerNode) return [];

    // Step 2: Under 'tractor', find 'App'
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

const TractorOEM = async () => {
    const tractorTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const tractorText = await tractorTextRes.json();

    const mergedData = await transformOverallChartData();
    const mergedDataMarket = await fetchTractorMarketShareData();

    const mergedDataApp = await fetchTractorAppData();
    const mergedDataEV = await fetchTractorEVData();

    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h3>
                            Tractor OEM
                        </h3>
                        <div
                            className='category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: tractorText.tractor || '<p>content is loading...</p>' }}
                        />
                    </div>

                    <div className='col-12 mt-3'>
                        {/* <TwoWheelerChart piedata={mergedDataMarket} /> */}
                        <TractorChart segmentName="tractor" segmentType='market share' />


                    </div>
                    {/* <div className="col-12 mt-5">
                        <Tractor_EV />
                    </div> */}
                    <div className="col-12">
                        <h3 className="mt-4">
                            Forecast Chart
                        </h3>
                        {/* <TractorForecast /> */}
                        <LineChartWithTotal overallData={mergedData} category='TRAC'/>
                    </div>

                    <div className="col-12">
                        <h3 className="mt-4">
                            Application Chart
                        </h3>
                        {/* <TractorApplication /> */}
                        <TractorApp segmentName='tractor' />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TractorOEM;

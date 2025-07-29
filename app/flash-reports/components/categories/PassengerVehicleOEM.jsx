/* eslint-disable react/no-unescaped-entities */
// import dynamic from "next/dynamic";
import React from 'react';
// import FourWheelerEVShare from '../ev/FourWheeler-EV';

import FourWheelerChart from '../charts/Piechart/PieChart'
import PassengerVehicleApp from '../charts/Piechart/AppicationPiechart'
import PassengerVehicle_Piechart from '../dynamic-charts/OEM_Charts/PassengerVehiclePieChart'
import LineChartWithTotal from '../charts/NewTestLineChart'
// import FourAwheelerDummy from '../ev/DummyFourwheeler'

// const PassengerVehicle_Piechart = dynamic(
//     () => import("../charts/PassengerVehiclePieChart"),
//     { ssr: false }
// );

// const FourWheelerApplication = dynamic(
//     () => import("../DummyAppSplit/FourWheeler"),
//     { ssr: false }
// );

import './category.css'

import PassengerForecast from '../Forecast-chart/FourWheeler';
import FourWheelerEVShare from '../dynamic-charts/ev/FourWheeler-EV'


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



async function fetchPassengerVehicleData() {
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
        (k) => k.toLowerCase() === "passenger vehicle"
    );

    if (!twoWheelerKey) return [];

    const monthValues = segmentData[twoWheelerKey];

    return Object.entries(monthValues).map(([month, value]) => ({
        month,
        value,
    }));
}


async function fetchPassengerVehicleMarketShareData() {
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
        (n) => n.name.toLowerCase() === "passenger vehicle"
    );
    if (!twoWheelerNode) return [];

    // Step 2: Under 'Two Wheeler', find 'Market Share'
    const marketShareNode = hirarchydata.find(
        (n) =>
            n.name.toLowerCase() === "market share " &&
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


async function fetchPassengerVehicleAppData() {
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
        (n) => n.name.toLowerCase() === "passenger vehicle"
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

async function fetchPassengerVehicleEVData() {
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
        (n) => n.name.toLowerCase() === "passenger vehicle"
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

const passengerVehicle = async () => {
    const passengerVehicleTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const passengerVehicleText = await passengerVehicleTextRes.json();

    const mergedData = await transformOverallChartData();
    const mergedDataMarket = await fetchPassengerVehicleMarketShareData();
    const mergedDataApp = await fetchPassengerVehicleAppData();
    const mergedDataEV = await fetchPassengerVehicleEVData();


    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h3>
                            {passengerVehicleText.passenger_heading || 'Passenger Vehicle Market Performance'}
                        </h3>
                        <div
                            className='category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: passengerVehicleText.passenger_vehicle_main || '<p>content is loading...</p>' }}
                        />
                    </div>

                    <div className='col-12 mt-3'>
                        {/* <TwoWheelerChart piedata={mergedDataMarket} /> */}
                        <FourWheelerChart segmentName="passenger vehicle" segmentType='market share' />

                    </div>

                    {/* <div className='col-12 mt-3'>
                        <PassengerVehicle_Piechart />
                      
                    </div> */}

                    <div className="col-12 mt-5 pt-0">
                        <div
                            className=''
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: passengerVehicleText.passenger_vehicle_secondary || '<p>content is loading...</p>' }}
                        />
                    </div>

                    <div className="col-12">
                        <h4 style={{ color: "#59bea0" }} className="text-center my-3">
                            Passenger Vehicle EV Electric Share Comparison
                        </h4>

                        <FourWheelerChart segmentName="passenger vehicle" segmentType='ev' />
                        {/* <FourWheelerEVShare /> */}
                        {/* <FourAwheelerDummy/> */}
                        {/* <div className="text-center">
                            <h4 style={{ color: "#59bea0" }}>PV EV Electric Share Comparison</h4>
                        </div>
                        <FourWheelerChart piedata={mergedDataEV} /> */}
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Forecast Chart
                        </h2>
                       <LineChartWithTotal overallData={mergedData} category='PV'/>
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Application Chart
                        </h2>
                        {/* <FourWheelerApplication /> */}
                        <PassengerVehicleApp segmentName='passenger vehicle' />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default passengerVehicle;

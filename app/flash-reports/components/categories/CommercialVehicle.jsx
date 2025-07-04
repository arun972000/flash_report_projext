/* eslint-disable @next/next/no-img-element */


import React from 'react'
import StaticCommercialSegmentChart from '../charts/DummyStackBarChart'
import CM_Piechart from '../charts/CM-PieChart'
import CommercialVehicleChart from '../charts/Piechart/PieChart'
import CommercialVehicleReport from '../Forecast-chart/CommercialVehicle'
import Link from 'next/link'
import './cv.css'
// import Image from 'next/image'
import CommercialVehicleBarChart from '../charts/Barchart/stackBarChart'
import Image from 'next/image'

import CVPieChart from '../dynamic-charts/OEM_Charts/CM-PieChart'

async function fetchCommercialVehicleData() {
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
    (k) => k.toLowerCase() === "commercial vehicle"
  );

  if (!twoWheelerKey) return [];

  const monthValues = segmentData[twoWheelerKey];

  return Object.entries(monthValues).map(([month, value]) => ({
    month,
    value,
  }));
}



async function fetchCommercialMarketShareData() {
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
        (n) => n.name.toLowerCase() === "commercial vehicle"
    );
    if (!twoWheelerNode) return [];

    // Step 2: Under 'Two Wheeler', find 'Market Share'
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



async function fetchCVBarChartData() {
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

  // Find "cv bar chart" node
  const cvNode = hierarchyData.find(
    (n) => n.name.toLowerCase() === "cv bar chart"
  );
  if (!cvNode) return [];

  // Build path for that node
  const buildPath = (id) => {
    const path = [];
    let current = hierarchyData.find((n) => n.id === id);
    while (current) {
      path.unshift(current.id);
      current = hierarchyData.find((n) => n.id === current.parent_id);
    }
    return path.join(",");
  };

  const streamPath = buildPath(cvNode.id);

  // Match volume entry by stream
  const matchedEntry = volumeData.find((v) => v.stream === streamPath);
  if (!matchedEntry || !matchedEntry.data) return [];

  // Format and sort the month data
  const formatted = Object.entries(matchedEntry.data).map(
    ([month, valueObj]) => ({
      month: month.toUpperCase().replace(" ", "-"), // e.g., "MAY 25" -> "MAY-25"
      LCV: valueObj.LCV ?? 0,
      MCV: valueObj.MCV ?? 0,
      HCV: valueObj.HCV ?? 0,
    })
  ).sort((a, b) => {
    // Sort descending based on date
    const toDate = (m) => new Date(`01-${m.replace("-", "-")}`);
    return toDate(b.month) - toDate(a.month);
  });

  return formatted;
}


const CommercialVehicle = async () => {
    const commercialTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const commercialText = await commercialTextRes.json();

    const mergedData = await fetchCommercialMarketShareData();
    const mergedDataCV = await fetchCVBarChartData();

    return (
        <>
            <div className='px-lg-4'>
                <div className='container-fluid'>
                    <div className="row">
                        <div className='col-12 mt-4'>
                            <h3>{commercialText.commercial_heading || 'Commercial Vehicle OEM Performance'}</h3>
                            <div
                                className='category_content'
                                style={{ textAlign: 'justify' }}
                                dangerouslySetInnerHTML={{ __html: commercialText.commercial_vehicle || '<p>content is loading...</p>' }}
                            />
                        </div>

                        <div className='col-12 mt-3'>
                            {/* <CM_Piechart /> */}
                            {/* <CommercialVehicleChart piedata={mergedData} /> */}
                            <CVPieChart/>
                        </div>

                        <div className='col-12 mt-5'>
                            <h3>Commercial Vehicles Segmental Split</h3>
                            {/* <CustomStackBarChart /> */}
                            {/* <CommercialVehicleBarChart data={mergedDataCV}/> */}
                            <StaticCommercialSegmentChart />
                        </div>

                        <div className='col-12'>
                            <h3 className="mt-4">Forecast Chart</h3>
                            <CommercialVehicleReport />
                        </div>



                        <div className="container mt-5">
                            <h2 className="text-center mb-4" style={{ fontWeight: '700' }}>
                                Application Segments
                            </h2>
                            {/* <div className='col-12 mt-3'>
                                <Link href='https://raceautoindia.com/subscription'><div style={{ width: '100%', position: 'relative', aspectRatio: '4.18/1', border: '1px solid white' }}>
                                    <Image src="/images/fr-table.jpg" alt='flash-report-table' fill />
                                </div></Link>
                            </div> */}
                            <div className="d-flex justify-content-center gap-5 flex-wrap">
                               <Link
                                    href="/flash-reports/bus"
                                    className="text-decoration-none text-dark text-center segment-card"
                                >
                                    <div className="icon-circle bg-primary text-white">
                                        <img
                                            src="/images/bus 2.png"   // adjust path if needed
                                            alt="Bus"
                                            style={{ width: 50, height: 50, objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div className="mt-2 fw-semibold fs-5" style={{ color: 'white' }}>Bus</div>
                                </Link>

                              
                                <Link
                                    href="/flash-reports/truck"
                                    className="text-decoration-none text-dark text-center segment-card"
                                >
                                    <div className="icon-circle bg-success text-white">
                                        <img
                                            src="/images/truck.png"  // adjust path if needed
                                            alt="Truck"
                                            style={{ width: 50, height: 50, objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div className="mt-2 fw-semibold fs-5" style={{ color: 'white' }}>Truck</div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CommercialVehicle

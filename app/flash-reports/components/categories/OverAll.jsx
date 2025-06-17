/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import LineChartWithTotal from '../charts/LineCharts'
import RechartsChart from '../charts/customizechart'
import DummyBarChart from '../charts/DummyBarChart'
import './category.css'
import OverAllLineChart from '../charts/LineChart/LineChart'

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

  const segmentData = matchedEntry.data; // contains "bus", "truck", etc.

  // Gather all months from first segment (e.g., bus)
  const allMonths = Object.keys(Object.values(segmentData)[0] || {});

  const formatted = allMonths.map((month) => {
    const entry = { month };

    // For each vehicle type, get value for that month
    for (const [segment, dataByMonth] of Object.entries(segmentData)) {
      // Normalize keys
      let key = segment.toLowerCase();
      if (key === "two wheeler") key = "2-wheeler";
      if (key === "three wheeler") key = "3-wheeler";
      entry[key] = dataByMonth[month] || 0;
    }

    // Calculate total
    const vehicleKeys = [
      "2-wheeler",
      "3-wheeler",
      "bus",
      "truck",
      "passenger",
      "tractor",
      "cv",
    ];
    entry.total = vehicleKeys.reduce(
      (sum, k) => sum + (entry[k] || 0),
      0
    );

    return entry;
  });

  return formatted;
}


const OverAll = async () => {

    const overAllTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const overAllText = await overAllTextRes.json();

    const mergedData = await transformOverallChartData();


    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                {/* <DownloadAllButton/> */}
                <div className='row'>
                    <h2>
                        {overAllText.overall_heading || 'Overall Automotive Industry'}
                    </h2>
                    <div className='col-12 px-2'>
                        <LineChartWithTotal />
                        {/* <OverAllLineChart data={mergedData} /> */}
                        {/* <p className='mt-5' style={{ textAlign: 'justify' }}>
                            In April 2025, the <span className='text-warning'>Two-Wheeler (2W)</span> segment recorded 1,686,774 units, reflecting strong month-on-month growth from 1.51 million in March and 1.35 million in February, marking the highest volume in the past four months. <span className='text-warning'>Three-Wheeler (3W)</span> sales remained broadly stable at 99,766 units, showing minimal change from March (99,376 units) and February (94,181 units), although still trailing January’s peak of 107,033 units. <span className='text-warning'>Passenger Vehicle (PV)</span> sales held steady at 349,939 units, virtually unchanged from March (350,603 units), but significantly lower than the January high of 465,920 units. <span className='text-warning'>The Tractor (TRAC)</span> segment experienced a decline to 60,915 units, down from 74,013 in March and 93,381 in January, continuing its downward trend. <span className='text-warning'>Commercial Vehicle (CV)</span> sales in April stood at 90,558 units, slightly down from 94,764 in March and 99,425 in January. Overall, April witnessed a robust recovery in 2Ws, stability in PVs and 3Ws, and continued weakness in the TRAC and CV segments.</p> */}
                        <div
                            className='mt-3 category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: overAllText.overall_oem_main || '<p>content is loading...</p>' }}
                        />
                    </div>
                    <div className='col-12'>
                        <h2 className="mb-3">{overAllText.alternative_fuel_heading || 'April 2025 – Alternative Fuel Adoption Summary'}</h2>
                        {/* <RechartsChart /> */}
                        <DummyBarChart />
                        <div
                            className='mt-2 category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: overAllText.overall_oem_secondary || '<p>content is loading...</p>' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OverAll

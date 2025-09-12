/* eslint-disable react/no-unescaped-entities */
import React from 'react'
// import LineChartWithTotal from '../charts/LineCharts'
import LineChartWithTotal from '../charts/NewTestLineChartv2'
// import DummyBarChart from '../charts/DummyBarChart'
import DummyBarChart from '../charts/Barchart/AlternateChart'
import './category.css'

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
            <LineChartWithTotal overallData={mergedData} category='Total' />
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
            <DummyBarChart segmentName="alternative fuel" />

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

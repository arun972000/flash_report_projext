/* eslint-disable @next/next/no-img-element */


import React from 'react'
import CommercialVehicleChart from '../charts/Piechart/PieChart'
import Link from 'next/link'
import './cv.css'
// import Image from 'next/image'
import LineChartWithTotal from '../charts/NewTestLineChartv2'
import CVSegmentChart from '../charts/Barchart/DynamicStackbar'


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



const CommercialVehicle = async () => {
  const commercialTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
  const commercialText = await commercialTextRes.json();

  const mergedData = await transformOverallChartData();

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
            <div className="container my-2">
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
              <p className='text-center m-0 p-0 mt-2' style={{fontSize:'0.8rem'}}><i>Click here for truck and bus sales performance with segmental/application split</i></p>
            </div>
            <div className='col-12 mt-3'>
              <CommercialVehicleChart segmentName="commercial vehicle" segmentType='market share' />
            </div>

            {/* <div className='col-12 mt-3'>

                            <CVPieChart/>
                        </div> */}

            <div className='col-12 mt-5'>
              <h3>Commercial Vehicles Segmental Split</h3>
              {/* <CustomStackBarChart /> */}
              {/* <CommercialVehicleBarChart data={mergedDataCV}/> */}
              {/* <StaticCommercialSegmentChart /> */}
              <CVSegmentChart segmentName="commercial vehicle" />
            </div>

            <div className='col-12'>
              <h3 className="mt-4">Forecast Chart</h3>
              {/* <CommercialVehicleReport /> */}
              <LineChartWithTotal overallData={mergedData} category='CV' />
            </div>


          </div>
        </div>
      </div>
    </>
  )
}

export default CommercialVehicle

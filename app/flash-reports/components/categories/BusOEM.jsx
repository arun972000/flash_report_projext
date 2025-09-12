
import React from 'react';
import BusChart from '../charts/Piechart/PieChart'
import './category.css'
import TwoWheelerApp from '../charts/Piechart/AppicationPiechart'
import LineChartWithTotal from '../charts/NewTestLineChartv2'
import CVSegmentChart from "../charts/Barchart/DynamicStackbar";

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


const BusOEM = async () => {
    const twoWheelerTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const twoWheelerText = await twoWheelerTextRes.json();

    const mergedData = await transformOverallChartData();


    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h2>
                            {twoWheelerText.bus_heading || 'Bus OEM Performance'}
                        </h2>
                        <div
                            className='category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: twoWheelerText.bus || '<p>content is loading...</p>' }}
                        />
                    </div>
                    <div className='col-12 mt-3'>
                        <BusChart segmentName="bus" segmentType='market share' />
                    </div>

                    <div className='col-12 mt-3'>
                        {/* <BusOEMChart /> */}
                        <CVSegmentChart segmentName="bus" />
                    </div>

                    {/* <div className="col-12 mt-5">
                        <BusEV />
                    </div> */}

                    <div className="col-12">
                        <h2 className="mt-4">
                            Forecast Chart
                        </h2>
                        {/* <BusForecast /> */}
                        <LineChartWithTotal overallData={mergedData} category='Bus' />
                    </div>

                    {/* <div className="col-12">
                        <h2 className="mt-4">
                            Application Chart
                        </h2>
                        <BusApplication />
                    </div> */}
                    <div className="col-12">
                        <h2 className="mt-4">
                            Application Chart
                        </h2>
                        <TwoWheelerApp segmentName='bus' />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusOEM;

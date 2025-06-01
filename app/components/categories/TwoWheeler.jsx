import dynamic from "next/dynamic";
import React from 'react';
import ForecastChart from '../charts/DummyLineChart';
import CustomPieChart from '../charts/PieChart'
import TwoWheelerOEM from "../charts/PieChart";

// import CustomPieChart from "../charts/PieChart";
const TwoWheelerEV = dynamic(() => import("../ev/TwoWheeler-EV"), { ssr: false });
const TwoWheelerForecast = dynamic(() => import("../Forecast-chart/Twowheeler"), { ssr: false });

const TwoWheeler = async () => {
    const twoWheelerTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const twoWheelerText = await twoWheelerTextRes.json();

    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h2>
                            {twoWheelerText.twowheeler_heading || 'Two-Wheeler OEM Performance'}
                        </h2>
                        <div
                            className=''
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: twoWheelerText.twowheeler || '<p>content is loading...</p>' }}
                        />
                    </div>

                    <div className='col-12 mt-3'>
                        <TwoWheelerOEM />
                    </div>

                    <div className="col-12 mt-5">
                        <TwoWheelerEV />
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Forecast Chart
                        </h2>
                        <TwoWheelerForecast />
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Application Chart
                        </h2>
                        <ForecastChart />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TwoWheeler;

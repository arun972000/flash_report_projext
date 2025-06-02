import dynamic from "next/dynamic";
import React from 'react';
import TruckApplication from "../application-split/Truck";
const TruckOEMChart = dynamic(() => import("../charts/TruckOEM"), { ssr: false });
const TruckEV = dynamic(() => import("../ev/Truck-EV"), { ssr: false });
const TruckForecast = dynamic(() => import("../Forecast-chart/Truck"), { ssr: false });

const TruckOEM = async () => {
    const twoWheelerTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const twoWheelerText = await twoWheelerTextRes.json();

    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h2>
                            {twoWheelerText.twowheeler_heading || 'Truck OEM Performance'}
                        </h2>
                        <div
                            className=''
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: twoWheelerText.twowheeler || '<p>content is loading...</p>' }}
                        />
                    </div>

                    <div className='col-12 mt-3'>
                        <TruckOEMChart />
                    </div>

                    <div className="col-12 mt-5">
                        <TruckEV />
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Forecast Chart
                        </h2>
                        <TruckForecast />
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Application Chart
                        </h2>
                        <TruckApplication />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TruckOEM;

import dynamic from "next/dynamic";
import React from 'react';
import BusApplication from "../application-split/Bus";
const BusOEMChart = dynamic(() => import("../charts/BusOEM"), { ssr: false });
const BusEV = dynamic(() => import("../ev/Bus-EV"), { ssr: false });
const BusForecast = dynamic(() => import("../Forecast-chart/Bus"), { ssr: false });

const BusOEM = async () => {
    const twoWheelerTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const twoWheelerText = await twoWheelerTextRes.json();

    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h2>
                            {twoWheelerText.bus_heading || 'Bus OEM Performance'}
                        </h2>
                        <div
                            className=''
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: twoWheelerText.bus || '<p>content is loading...</p>' }}
                        />
                    </div>

                    <div className='col-12 mt-3'>
                        <BusOEMChart />
                    </div>

                    <div className="col-12 mt-5">
                        <BusEV />
                    </div>

                    {/* <div className="col-12">
                        <h2 className="mt-4">
                            Forecast Chart
                        </h2>
                        <BusForecast />
                    </div> */}

                    <div className="col-12">
                        <h2 className="mt-4">
                            Application Chart
                        </h2>
                        <BusApplication />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusOEM;

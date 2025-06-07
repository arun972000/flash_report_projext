/* eslint-disable react/no-unescaped-entities */
import dynamic from "next/dynamic";
import React from 'react';
import FourWheelerEVShare from '../ev/FourWheeler-EV';

const PassengerVehicle_Piechart = dynamic(
    () => import("../charts/PassengerVehiclePieChart"),
    { ssr: false }
);

const FourWheelerApplication = dynamic(
    () => import("../DummyAppSplit/FourWheeler"),
    { ssr: false }
);

import './category.css'

import PassengerForecast from '../Forecast-chart/FourWheeler';

const passengerVehicle = async () => {
    const passengerVehicleTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const passengerVehicleText = await passengerVehicleTextRes.json();
    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h3>
                            Passenger Vehicle Market Performance – April 2025
                        </h3>
                        <div
                            className='category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: passengerVehicleText.passenger_vehicle_main || '<p>content is loading...</p>'}}
                        />
                    </div>

                    <div className='col-12 mt-3'>
                        <PassengerVehicle_Piechart />
                    </div>

                    <div className="col-12 mt-5 pt-0">
                        <div
                            className=''
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: passengerVehicleText.passenger_vehicle_secondary || '<p>content is loading...</p>' }}
                        />
                    </div>

                    <div className="col-12">
                        <FourWheelerEVShare />
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Forecast Chart
                        </h2>
                        <PassengerForecast />
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Application Chart
                        </h2>
                        <FourWheelerApplication />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default passengerVehicle;

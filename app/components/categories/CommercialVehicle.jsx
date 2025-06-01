

import React from 'react'
import CustomStackBarChart from '../charts/stackVerticalChart'
import CM_Piechart from '../charts/CM-PieChart'
import CommercialVehicleReport from '../Forecast-chart/CommercialVehicle'

import Link from 'next/link'
import { FaBus, FaTruck } from 'react-icons/fa'  // Font Awesome icons
import './cv.css'


const CommercialVehicle = async () => {
    const commercialTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const commercialText = await commercialTextRes.json();

    return (
        <>
            <div className='px-lg-4'>
                <div className='container-fluid'>
                    <div className="row">
                        <div className='col-12 mt-4'>
                            <h3>Commercial Vehicle OEM Performance – April 2025</h3>
                            <div
                                className=''
                                style={{ textAlign: 'justify' }}
                                dangerouslySetInnerHTML={{ __html: commercialText.commercial_vehicle || '<p>content is loading...</p>' }}
                            />
                        </div>

                        <div className='col-12 mt-3'><CM_Piechart /></div>

                        <div className='col-12 mt-5'>
                            <h3>Commercial Vehicles Segmental Split</h3>
                            <CustomStackBarChart />
                        </div>

                        <div className='col-12'>
                            <h3 className="mt-4">Forecast Chart</h3>
                            <CommercialVehicleReport />
                        </div>



                        <div className="container mt-5">
                            <h2 className="text-center mb-4" style={{ fontWeight: '700' }}>
                                Application Segments
                            </h2>

                            <div className="d-flex justify-content-center gap-5 flex-wrap">
                                {/* Bus Segment */}
                                <Link
                                    href="/bus"
                                    className="text-decoration-none text-dark text-center segment-card"
                                >
                                    <div className="icon-circle bg-primary text-white">
                                        <FaBus size={50} />
                                    </div>
                                    <div className="mt-2 fw-semibold fs-5" style={{ color: 'white' }}>Bus</div>
                                </Link>

                                {/* Truck Segment */}
                                <Link
                                    href="/truck"
                                    className="text-decoration-none text-dark text-center segment-card"
                                >
                                    <div className="icon-circle bg-success text-white">
                                        <FaTruck size={50} />
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

/* eslint-disable @next/next/no-img-element */


import React from 'react'
import CustomStackBarChart from '../charts/stackVerticalChart'
import CM_Piechart from '../charts/CM-PieChart'
import CommercialVehicleReport from '../Forecast-chart/CommercialVehicle'
import Link from 'next/link'
import './cv.css'
import Image from 'next/Image'



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
                                className='category_content'
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
<div className='col-12 mt-3'>
                            <Link href='https://raceautoindia.com/subscription'><div style={{ width: '100%', position: 'relative', aspectRatio: '4.18/1', border: '1px solid white' }}>
                                <Image src="/images/fr-table.jpg" alt='flash-report-table' fill />
                            </div></Link>
                        </div>
                            {/* <div className="d-flex justify-content-center gap-5 flex-wrap">
                               
                                    href="/bus"
                                    className="text-decoration-none text-dark text-center segment-card"
                                >
                                    <div className="icon-circle bg-primary text-white">
                                        <img
                                            src="/images/bus.png"   // adjust path if needed
                                            alt="Bus"
                                            style={{ width: 50, height: 50, objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div className="mt-2 fw-semibold fs-5" style={{ color: 'white' }}>Bus</div>
                                </Link>

                              
                                <Link
                                    href="/truck"
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
                            </div> */}

                        </div>


                    </div>
                </div>
            </div>
        </>
    )
}

export default CommercialVehicle

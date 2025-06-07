/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import LineChartWithTotal from '../charts/LineCharts'
import RechartsChart from '../charts/customizechart'
import './category.css'

const OverAll = async () => {

    const overAllTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const overAllText = await overAllTextRes.json()

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
                        {/* <p className='mt-5' style={{ textAlign: 'justify' }}>
                            In April 2025, the <span className='text-warning'>Two-Wheeler (2W)</span> segment recorded 1,686,774 units, reflecting strong month-on-month growth from 1.51 million in March and 1.35 million in February, marking the highest volume in the past four months. <span className='text-warning'>Three-Wheeler (3W)</span> sales remained broadly stable at 99,766 units, showing minimal change from March (99,376 units) and February (94,181 units), although still trailing January’s peak of 107,033 units. <span className='text-warning'>Passenger Vehicle (PV)</span> sales held steady at 349,939 units, virtually unchanged from March (350,603 units), but significantly lower than the January high of 465,920 units. <span className='text-warning'>The Tractor (TRAC)</span> segment experienced a decline to 60,915 units, down from 74,013 in March and 93,381 in January, continuing its downward trend. <span className='text-warning'>Commercial Vehicle (CV)</span> sales in April stood at 90,558 units, slightly down from 94,764 in March and 99,425 in January. Overall, April witnessed a robust recovery in 2Ws, stability in PVs and 3Ws, and continued weakness in the TRAC and CV segments.</p> */}
                        <div
                            className='mt-3 category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: overAllText.overall_oem_main || '<p>content is loading...</p>' }}
                        />
                    </div>
                    {/* <div className='col-12'>
                        <h2 className="mb-3">{overAllText.alternative_fuel_heading || 'April 2025 – Alternative Fuel Adoption Summary'}</h2>
                        <RechartsChart />
                        <div
                            className='mt-2 category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: overAllText.overall_oem_secondary || '<p>content is loading...</p>' }}
                        />
                    </div> */}
                </div>
            </div>
        </div>
    )
}

export default OverAll

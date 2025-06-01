'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'

import './styles/chart.css'

import Contents from './contents'
import Highlights from './Header/Highlights'

const FlashReportsHome = () => {
    const [bannerImages, setBannerImages] = useState({
        desktop: '/images/flash-report-banner-2.jpg',
        mobile: '/images/flash-report-mobile.jpeg',
    })

    useEffect(() => {
        async function fetchBannerImages() {
            try {
                const res = await fetch('/api/admin/flash-dynamic/flash-reports-text') // Replace with your actual API endpoint
                if (!res.ok) throw new Error('Failed to fetch banner images')
                const data = await res.json()

                // Assuming API response like:
                // { desktop: 'https://cdn.example.com/desktop-banner.jpg', mobile: 'https://cdn.example.com/mobile-banner.jpg' }

                setBannerImages({
                    desktop: `${process.env.NEXT_PUBLIC_S3_BUCKET_URL}${data.main_banner_url}` ,
                    mobile: `${process.env.NEXT_PUBLIC_S3_BUCKET_URL}${data.mobile_banner_url}`,
                })
            } catch (error) {
                console.error('Error fetching banner images:', error)
                // fallback to default static images if API fails
            }
        }

        fetchBannerImages()
    }, [])

    return (
        <>
            <div className='container-fluid'>
                <div style={{ position: 'relative', width: '100%' }} className='mb-1 flash-banner'>
                    {/* Desktop Banner */}
                    <div className='banner-desktop'>
                        <Image
                            src={bannerImages.desktop}
                            alt='flash-reports-banner'
                            fill
                            className='image-fit'
                            priority
                        />
                    </div>

                    {/* Mobile Banner */}
                    <div className='banner-mobile'>
                        <Image
                            src={bannerImages.mobile}
                            alt='flash-reports-banner-mobile'
                            fill
                            className='image-fit'
                            priority
                        />
                    </div>
                </div>

                <div className='container-fluid ms-lg-2'>
                    <div className='row g-0 m-0 p-0 justify-content-between'>
                        <div className='col-12 col-lg-4 '>
                            <Contents />
                        </div>
                        <div className='col-12 col-lg-6 col-xl-8'>
                            <Highlights />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default FlashReportsHome

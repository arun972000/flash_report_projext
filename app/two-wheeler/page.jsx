import React from 'react'
import TwoWheeler from '../components/categories/TwoWheeler'
import Header from '../components/Header/Header'
import FlashReportsHome from '../components/home'
import ReportsFooter from '../components/Footer'
import { Bricolage_Grotesque } from "next/font/google";

const bricolage = Bricolage_Grotesque({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const page = () => {
  return (
    <div className={`${bricolage.className} flash-reports`}>
      <Header />
      <FlashReportsHome />
      <TwoWheeler />
      <ReportsFooter />
    </div>
  )
}

export default page
'use client'

import React, { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts'

// Custom formatter to add % symbol
const formatPercent = (value) => `${value}%`

const CommercialSegmentChart = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await fetch('/api/commercial-segment')
        const json = await res.json()

        const formatted = json.map((item) => ({
          month: item.month,
          hcv: Number(item.hcv),
          mcv: Number(item.mcv),
          lcv: Number(item.lcv),
        }))

        setData(formatted)
      } catch (error) {
        console.error('Error fetching chart data:', error)
      }
    }

    fetchChartData()
  }, [])

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={380}>
        <BarChart
          layout="vertical"
          data={data}
          barCategoryGap="30%"
          margin={{ top: 10, right: 50, left: 40, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={formatPercent} />
          <YAxis dataKey="month" type="category" />
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
          <Bar dataKey="hcv" stackId="a" fill="#3ab8b4">
            <LabelList dataKey="hcv" position="insideRight" formatter={formatPercent} fill="#fff" fontSize={12} />
          </Bar>
          <Bar dataKey="mcv" stackId="a" fill="#81ea81">
            <LabelList dataKey="mcv" position="insideRight" formatter={formatPercent} fill="#000" fontSize={12} />
          </Bar>
          <Bar dataKey="lcv" stackId="a" fill="#ffc658">
            <LabelList dataKey="lcv" position="insideRight" formatter={formatPercent} fill="#000" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CommercialSegmentChart

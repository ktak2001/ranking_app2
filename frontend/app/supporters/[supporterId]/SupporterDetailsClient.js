'use client';

import React, { useState, useEffect } from "react";
import { yearMonth } from "@/app/lib/useful.js";
import TabNavigation from "@/components/TabNavigation.js";
import YoutuberCard from "@/components/YoutuberCards.js";
import Image from "next/image";
import { getSupportingYoutubers } from "@/app/lib/api.js";

export default function SupporterDetailsClient({ supporterInfo, params }) {
  const {year, month} = yearMonth()
  const [youtubers, setYoutubers] = useState([])
  const [showYear, setShowYear] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(month)
  const allMonthArr = Array.from({length: parseInt(month) - 3}, (_, i) => String(parseInt(month) - i).padStart(2, '0'));

  useEffect(() => {
    getSupportingYoutubers(year, selectedMonth, params.supporterId, showYear)
      .then(data => {
        setYoutubers(data)
      })
  }, [year, selectedMonth, params, showYear])

  return (
    <div>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingLeft: '20px' }}>
        <Image
        src={supporterInfo.supporterIconUrl}
        alt={`${supporterInfo.supporterName} icon`}
        style={{ borderRadius: '50%', marginRight: '10px' }}
        width={50}
        height={50}
        unoptimized
        />
        <div>
          <h1 style={{ margin: 0 }}>{supporterInfo.supporterName}</h1>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>
            {supporterInfo.supporterCustomUrl}
          </div>
        </div>
      </header>
      <TabNavigation 
        selectedMonth={selectedMonth} 
        setSelectedMonth={setSelectedMonth} 
        setShowYear={setShowYear} 
        allMonthArr={allMonthArr} 
        year={year}
        showYear={showYear}
      />
      <div className="container text-center">
        <div className="row">
          {youtubers.map(youtuber => (
            <div key={youtuber.youtuberId} className="col mb-4">
              <YoutuberCard youtuber={youtuber} inSupporterPage={true} />
            </div>
          ))}
          {youtubers.length==0 && (
            <h1>Not supported this month</h1>
          )}
        </div>
      </div>
    </div>
  )
}
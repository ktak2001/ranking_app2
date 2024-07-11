'use client';

import React, { useState, useEffect } from 'react';
import TabNavigation from "@/components/TabNavigation.js";
import YoutuberCard from "@/components/YoutuberCards.js";
import { getYoutubersRanking } from './lib/api.js';

export default function ClientHome({ initialYoutubers, year, month }) {
  const [youtubers, setYoutubers] = useState(initialYoutubers)
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [currentMonth, setCurrentMonth] = useState(month)
  const [showYear, setShowYear] = useState(false);
  const allMonthArr = Array.from({length: parseInt(month) - 3}, (_, i) => String(parseInt(month) - i).padStart(2, '0'));
  useEffect(() => {
    if (currentMonth !== selectedMonth) {
      getYoutubersRanking(year, selectedMonth, showYear)
        .then(data => {
          setYoutubers(data)
          setCurrentMonth(selectedMonth)
        })
    }
  }, [year, selectedMonth, showYear])
  return (
    <div>
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
              <YoutuberCard youtuber={youtuber} inSupporterPage={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
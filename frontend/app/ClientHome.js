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
    if (showYear || currentMonth !== selectedMonth) {
      console.log("inside useEffect", "showYear: ", showYear, "currentMonth: ", currentMonth, "selectedMonth: ", selectedMonth)
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
      <div className="d-flex flex-column align-items-end mb-3 me-3">
        <p className="mb-2">改善してほしいことがあればなんでも送ってください。</p>
        <div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText('vtuber.nagesen.ranking@gmail.com');
              alert('メールアドレスをコピーしました');
            }} 
            className="btn btn-outline-secondary btn-sm me-2"
          >
            メール: vtuber.nagesen.ranking@gmail.com
          </button>
          <a href="https://twitter.com/vtuber_nagesen" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
            Twitter: @vtuber_nagesen
          </a>
        </div>
      </div>
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
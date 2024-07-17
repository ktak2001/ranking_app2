'use client';

import React, { useState, useEffect } from 'react';
import TabNavigation from "@/components/TabNavigation.js";
import SupporterCard from '@/components/SupporterCard.js';
import YoutuberCard from "@/components/YoutuberCards.js";
import { getYoutubersRanking, getAllSupportersRanking } from './lib/api.js';

export default function ClientHome({ initialYoutubers, initialSupporters, year, month }) {
  const [youtubers, setYoutubers] = useState([])
  const [supporters, setSupporters] = useState(initialSupporters)
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [currentMonth, setCurrentMonth] = useState(month)
  const [showYear, setShowYear] = useState(false);
  const [showSupportersRanking, setShowSupportersRanking] = useState(true)
  const [currentShowSupporters, setCurrentShowSupporters] = useState(true)
  const [loading, setLoading] = useState(false)
  const allMonthArr = Array.from({length: parseInt(month) - 3}, (_, i) => String(parseInt(month) - i).padStart(2, '0'));
  useEffect(() => {
    if (showYear || currentMonth !== selectedMonth || showSupportersRanking !== currentShowSupporters) {
      console.log("inside useEffect", "showYear: ", showYear, "currentMonth: ", currentMonth, "selectedMonth: ", selectedMonth, "showSupporterRanking: ", showSupportersRanking)
      setLoading(true)
      if (showSupportersRanking) {
        getAllSupportersRanking(year, selectedMonth, showYear)
          .then(data => {
            setSupporters(data)
            setCurrentMonth(selectedMonth)
            setCurrentShowSupporters(true)
            setLoading(false)
          })
      } else {
        getYoutubersRanking(year, selectedMonth, showYear)
          .then(data => {
            console.log("youtubers data", data)
            setYoutubers(data)
            setCurrentMonth(selectedMonth)
            setCurrentShowSupporters(false)
            setLoading(false);
          })
      }
    }
  }, [year, selectedMonth, showYear, showSupportersRanking])
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
      <div className="d-flex justify-content-between align-items-center mb-3 mx-3">
        <div className="dropdown">
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button"
            id="dropdownMenuButton"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {showSupportersRanking ? "Supporters" : "Youtubers"}
          </button>
          <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <li>
              <button
                className="dropdown-item"
                onClick={() => setShowSupportersRanking(false)}
              >
                Youtubers
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => setShowSupportersRanking(true)}
              >
                Supporters
              </button>
            </li>
          </ul>
        </div>
        <div className="text-end">
          <p className="mb-2">
            β版です。改善してほしいことがあればなんでも送ってください。
          </p>
          <div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  "vtuber.nagesen.ranking@gmail.com"
                );
                alert("メールアドレスをコピーしました");
              }}
              className="btn btn-outline-secondary btn-sm me-2"
            >
              メール: vtuber.nagesen.ranking@gmail.com
            </button>
            <a
              href="https://twitter.com/vtuber_nagesen"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm"
            >
              Twitter: @vtuber_nagesen
            </a>
          </div>
        </div>
      </div>
      {!showSupportersRanking && !loading && (
        <div className="container text-center">
          <div className="row">
            {youtubers.map((youtuber) => (
              <div key={youtuber.youtuberId} className="col mb-4">
                <YoutuberCard youtuber={youtuber} inSupporterPage={false} />
              </div>
            ))}
          </div>
        </div>
      )}
      {showSupportersRanking && !loading && (
        <div className="container text-center">
          <div className="row">
            {supporters.slice(0, 30).map((supporter, i) => (
              <div key={i} className="col mb-4">
                <SupporterCard supporter={supporter} />
              </div>
            ))}
          </div>
        </div>
      )}
      {
        loading && (
          <div>loading</div>
        )
      }
    </div>
  );
}
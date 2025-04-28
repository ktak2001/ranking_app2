'use client';

import React, { useState, useEffect } from 'react';
import TabNavigation from '@/components/TabNavigation.js';
import SupporterCard from '@/components/SupporterCard.js';
import YoutuberCard  from '@/components/YoutuberCards.js';
import RankingTable from '../components/RankingTable.js';
import {
  getYoutubersRanking,
  getAllSupportersRanking
} from './lib/api.js';

export default function ClientHome2({ initialYoutubers, initialSupporters }) {
  /* ==== 現在日付 ==== */
  const today        = new Date();
  const thisYear     = today.getFullYear();
  const thisMonthStr = String(today.getMonth() + 1).padStart(2, '0');

  /* ==== state ==== */
  const [selectedYear,  setSelectedYear]  = useState(thisYear);
  const [selectedMonth, setSelectedMonth] = useState(thisMonthStr);
  const [showYear,      setShowYear]      = useState(false);
  const [showSupporters,setShowSupporters]= useState(true);
  const [loading,       setLoading]       = useState(false);
  const [youtubers,     setYoutubers]     = useState(initialYoutubers);
  const [supporters,    setSupporters]    = useState(initialSupporters);

  /* ==== 選択可能な年・月 ==== */
  const earliestYear = 2024;
  const yearsArr = Array.from(
    { length: thisYear - earliestYear + 1 },
    (_, i) => thisYear - i      // 2025, 2024, …
  );

  const maxMonth = selectedYear === thisYear ? thisMonthStr : '12';
  const allMonthArr = Array.from(
    { length: parseInt(maxMonth, 10) },
    (_, i) => String(parseInt(maxMonth, 10) - i).padStart(2, '0')
  );

  /* ==== データ取得 ==== */
  useEffect(() => {
    setLoading(true);

    const fetcher = showSupporters
      ? getAllSupportersRanking
      : getYoutubersRanking;

    fetcher(selectedYear, selectedMonth, showYear)
      .then(data => {
        if (showSupporters) setSupporters(data);
        else                setYoutubers(data);
      })
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth, showYear, showSupporters]);

  /* ==== 画面 ==== */
  return (
    <div className="container-fluid pt-3">

      {/* フィルター */}
      <TabNavigation
        yearsArr={yearsArr}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        allMonthArr={allMonthArr}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        showYear={showYear}
        setShowYear={setShowYear}
      />

      {/* Supporter / Youtuber 切替ボタン */}
      <div className="mb-3">
        <div className="btn-group">
          <button
            className={`btn btn-outline-primary ${!showSupporters && 'active'}`}
            onClick={() => setShowSupporters(false)}
          >
            Youtubers
          </button>
          <button
            className={`btn btn-outline-primary ${showSupporters && 'active'}`}
            onClick={() => setShowSupporters(true)}
          >
            Supporters
          </button>
        </div>
      </div>

      {/* ランキングテーブル */}
      {loading && <p className="text-center">Loading…</p>}

      {!loading && (
        <RankingTable
          list={showSupporters ? supporters.slice(0, 100) : youtubers.slice(0, 100)}
          mode={showSupporters ? 'supporter' : 'youtuber'}
        />
      )}
    </div>
  );
}

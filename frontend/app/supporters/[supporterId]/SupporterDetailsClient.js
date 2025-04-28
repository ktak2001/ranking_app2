'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import TabNavigation from '@/components/TabNavigation.js';
import YoutuberCard from '@/components/YoutuberCards.js';
import { getSupportingYoutubers } from '@/app/lib/api.js';
import { yearMonth } from '@/app/lib/useful.js';
import SafeImage from "@/components/SafeImage.js";

export default function SupporterDetailsClient({ supporterInfo, params }) {
  /* ---------- 現在年月 ---------- */
  const { year: thisYear, month: thisMonthStr } = yearMonth();

  /* ---------- state ---------- */
  const [selectedYear, setSelectedYear] = useState(thisYear);
  const [selectedMonth, setSelectedMonth] = useState(thisMonthStr);
  const [showYear, setShowYear] = useState(false);
  const [youtubers, setYoutubers] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------- 選択可能な年・月 ---------- */
  const earliestYear = 2024;
  const yearsArr = Array.from(
    { length: thisYear - earliestYear + 1 },
    (_, i) => thisYear - i
  );

  const maxMonth =
    selectedYear === thisYear ? parseInt(thisMonthStr, 10) : 12;
  const allMonthArr = Array.from(
    { length: maxMonth },
    (_, i) => String(maxMonth - i).padStart(2, '0')
  );

  /* ---------- データ取得 ---------- */
  useEffect(() => {
    setLoading(true);
    getSupportingYoutubers(
      selectedYear,
      selectedMonth,
      params.supporterId,
      showYear
    )
      .then(data => setYoutubers(data))
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth, params.supporterId, showYear]);

  /* ---------- UI ---------- */
  return (
    <div>
      {/* プロフィールヘッダー */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
          paddingLeft: '20px'
        }}
      >
        <SafeImage
          fallbackSrc="/images/default-supporter.png"
          src={supporterInfo.supporterIconUrl}
          alt={`${supporterInfo.supporterName} icon`}
          width={50}
          height={50}
          style={{ borderRadius: '50%', marginRight: '10px' }}
          unoptimized
        />
        <div>
          <h1 style={{ margin: 0 }}>{supporterInfo.supporterName}</h1>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>
            {supporterInfo.supporterCustomUrl}
          </div>
        </div>
      </header>

      {/* 年月タブ */}
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

      {/* ランキング */}
      {loading && <p className="text-center">Loading…</p>}

      {!loading && (
        <div className="container text-center">
          <div className="row">
            {youtubers.map(y => (
              <div key={y.youtuberId} className="col mb-4">
                <YoutuberCard youtuber={y} inSupporterPage />
              </div>
            ))}
            {youtubers.length === 0 && <h1>Not supported this period</h1>}
          </div>
        </div>
      )}
    </div>
  );
}

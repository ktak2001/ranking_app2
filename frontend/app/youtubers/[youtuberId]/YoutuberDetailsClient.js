'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TabNavigation  from '@/components/TabNavigation.js';
import RankingTable   from '@/components/RankingTable.js';      // ★ 追加
import { getSupportersRanking, getYoutuberVideosRanking } from '@/app/lib/api.js';        // ★ 追加
import { useAuth }    from '@/app/lib/auth.js';
import { yearMonth, showMoney } from '@/app/lib/useful.js';     // ★ showMoney を追加
import SafeImage      from '@/components/SafeImage.js';

export default function YoutuberDetailsClient({ initialData, params }) {
  /* ---------- 現在年月 ---------- */
  const { year: thisYear, month: thisMonthStr } = yearMonth();

  /* ---------- state ---------- */
  const [selectedYear,  setSelectedYear]  = useState(thisYear);
  const [selectedMonth, setSelectedMonth] = useState(thisMonthStr);
  const [showYear,      setShowYear]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [showVideos,   setShowVideos]   = useState(false);
  const [videoList,    setVideoList]    = useState([]);
  const [topSupporters, setTopSupporters] = useState(initialData.rankingData.top_supporters ?? []); // ★
  const [totalAmount,   setTotalAmount]   = useState(initialData.rankingData.total_amount);   // ★

  /* ---------- 選択可能な年・月 ---------- */
  const earliestYear = 2024;
  const yearsArr  = Array.from({ length: thisYear - earliestYear + 1 }, (_, i) => thisYear - i);
  const maxMonth  = selectedYear === thisYear ? parseInt(thisMonthStr, 10) : 12;
  const allMonthArr = Array.from({ length: maxMonth }, (_, i) => String(maxMonth - i).padStart(2, '0'));

  /* ---------- その他 ---------- */
  const youtuberInfo       = initialData.youtuberInfo;
  const youtuberChannelUrl = `https://www.youtube.com/channel/${params.youtuberId}`;

  const user         = useAuth();
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get('payment');

  const [isProduction, setIsProduction] = useState(false);
  useEffect(() => { setIsProduction(process.env.NODE_ENV === 'production'); }, []);
  /* ---------- ランキング再取得 ---------- */
  useEffect(() => {                                                            // ★
    setLoading(true);
    getSupportersRanking(selectedYear, selectedMonth, params.youtuberId, showYear)
      .then(data => {
        setTopSupporters(data.top_supporters);
        setTotalAmount(data.total_amount);
      })
      .then(() => {
        getYoutuberVideosRanking(selectedYear, selectedMonth, params.youtuberId, showYear)
          .then((videos) => {
            setVideoList(videos)
          })
          .finally(() => setLoading(false))
      })
  }, [selectedYear, selectedMonth, showYear, params.youtuberId]);
  console.log({initialData})
  /* ---------- UI ---------- */
  return (
    <div className="mt-4 pt-5">
      {/* 決済メッセージ（省略） */}

      {/* プロフィールヘッダー */}
      <header
        style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingLeft: '20px' }}
      >
        <SafeImage
          fallbackSrc="/images/default-youtuber.png"
          src={youtuberInfo.youtuberIconUrl}
          alt={`${youtuberInfo.youtuberName} icon`}
          width={50}
          height={50}
          style={{ borderRadius: '50%', marginRight: '10px' }}
          unoptimized
        />
        <div>
          <h1 style={{ margin: 0 }}>{youtuberInfo.youtuberName}</h1>
          <a href={youtuberChannelUrl} target="_blank" rel="noopener noreferrer">
            <button className="btn btn-outline-primary" style={{ marginTop: '5px' }}>
              YouTubeチャンネル
            </button>
          </a>
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

      <div className="mb-3">
        <div className="btn-group">
          <button
            className={`btn btn-outline-primary ${!showVideos && "active"}`}
            onClick={() => setShowVideos(false)}
          >
            Supporters
          </button>
          <button
            className={`btn btn-outline-primary ${showVideos && "active"}`}
            onClick={() => setShowVideos(true)}
          >
            Videos
          </button>
        </div>
      </div>

      {/* 合計金額 */}
      <div className="ms-3 mb-2">
        <h3>{showMoney(totalAmount)}</h3>
      </div>

      {/* ランキング */}
      {loading && <p className="text-center">Loading…</p>}
      {!loading && (
        <RankingTable
          variant={showVideos ? "video-only" : "supporter-only"}
          list={showVideos ? videoList : topSupporters}
        />
      )}
    </div>
  );
}

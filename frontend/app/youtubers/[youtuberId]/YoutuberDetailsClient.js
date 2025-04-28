'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import TabNavigation from '@/components/TabNavigation.js';
import UserRankingClient from '@/components/UserRankingClient.js';
import { useAuth } from '@/app/lib/auth.js';
import { yearMonth } from '@/app/lib/useful.js';
import SafeImage from "@/components/SafeImage.js";

export default function YoutuberDetailsClient({ initialData, params }) {
  /* ---------- 現在年月 ---------- */
  const { year: thisYear, month: thisMonthStr } = yearMonth();

  /* ---------- state ---------- */
  const [selectedYear, setSelectedYear] = useState(thisYear);
  const [selectedMonth, setSelectedMonth] = useState(thisMonthStr);
  const [showYear, setShowYear] = useState(false);

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

  /* ---------- その他 ---------- */
  const youtuberInfo = initialData.youtuberInfo;
  const initialRankingData = initialData.rankingData;
  const youtuberChannelUrl = `https://www.youtube.com/channel/${params.youtuberId}`;

  const user = useAuth();
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get('payment');

  const [isProduction, setIsProduction] = useState(false);
  useEffect(() => {
    setIsProduction(process.env.NODE_ENV === 'production');
  }, []);

  /* ---------- UI ---------- */
  return (
    <div>
      {/* 決済メッセージ */}
      {paymentParam === 'cancel' && (
        <div
          className="alert alert-warning alert-dismissible fade show"
          role="alert"
        >
          Payment is canceled.
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
          />
        </div>
      )}
      {paymentParam === 'success' && (
        <div
          className="alert alert-primary alert-dismissible fade show"
          role="alert"
        >
          Payment succeeded. Please reload the page to look for new rank.
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
          />
        </div>
      )}

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
          <a
            href={youtuberChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button
              className="btn btn-outline-primary"
              style={{ marginTop: '5px' }}
            >
              YouTubeチャンネル
            </button>
          </a>
        </div>

        {/* 応援ボタン（ログイン済のみ） */}
        {user && user.supporterId !== '' && (
          <div className="ms-auto me-3">
            <form
              action={`${process.env.NEXT_PUBLIC_API_URL}/createCheckoutSession`}
              method="POST"
            >
              <input
                type="hidden"
                name="youtuberId"
                value={params.youtuberId}
              />
              <input
                type="hidden"
                name="supporterId"
                value={user.supporterId}
              />
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className={`btn btn-primary btn-lg ${
                  isProduction ? 'disabled' : ''
                }`}
                style={{
                  display: 'block',
                  opacity: isProduction ? 0.5 : 1,
                  cursor: isProduction ? 'not-allowed' : 'pointer'
                }}
                title={
                  isProduction
                    ? 'This feature is not available in production'
                    : '応援する'
                }
                disabled={isProduction}
              >
                応援する
              </button>
            </form>
          </div>
        )}
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
      <UserRankingClient
        initialData={initialRankingData}
        youtuberId={params.youtuberId}
        showYear={showYear}
        currentYear={selectedYear}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}

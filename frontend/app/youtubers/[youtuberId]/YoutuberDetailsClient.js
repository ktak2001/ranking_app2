'use client';

import React, { useState, useEffect } from "react";
import TabNavigation from "@/components/TabNavigation.js";
import { yearMonth } from "@/app/lib/useful.js";
import { useAuth } from "@/app/lib/auth.js";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import UserRankingClient from "@/components/UserRankingClient.js";

export default function YoutuberDetailsClient({ initialData, params }) {
  const {year, month} = yearMonth()
  const [selectedMonth, setSelectedMonth] = useState(month)
  const [showYear, setShowYear] = useState(false)
  const youtuberInfo = initialData.youtuberInfo
  const initialRankingData = initialData.rankingData
  const youtuberChannelUrl = `https://www.youtube.com/channel/${params.youtuberId}`
  const user = useAuth()
  const allMonthArr = Array.from({length: parseInt(month) - 3}, (_, i) => String(parseInt(month) - i).padStart(2, '0'));
  const searchParams = useSearchParams()
  const paymentParam = searchParams.get("payment")
  const [isProduction, setIsProduction] = useState(false);
  useEffect(() => {
    setIsProduction(process.env.NODE_ENV === 'production')
  }, [])
  return (
    <div>
      {
        paymentParam == "cancel" && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            Payment is canceled.
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )
      }
      {
        paymentParam == "success" && (
          <div className="alert alert-primary alert-dismissible fade show" role="alert">
            Payment succeeded. Please reload the page to look for new rank.
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )
      }
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingLeft: '20px' }}>
        <Image
        src={youtuberInfo.youtuberIconUrl}
        alt={`${youtuberInfo.youtuberName} icon`}
        style={{ borderRadius: '50%', marginRight: '10px' }}
        width={50}
        height={50}
        unoptimized
        />
        <div>
          <h1 style={{ margin: 0 }}>{youtuberInfo.youtuberName}</h1>
          <a href={youtuberChannelUrl} target="_blank" rel="noopener noreferrer">
            <button className="btn btn-outline-primary" style={{ marginTop: '5px' }}>Youtubeチャンネル</button>
          </a>
        </div>
        {
          user && user.supporterId != "" && (
            <div className="ms-auto me-3" >
              <form action={`${process.env.NEXT_PUBLIC_API_URL}/createCheckoutSession`} method="POST">
                <input type="hidden" name="youtuberId" value={params.youtuberId} />
                <input type="hidden" name="supporterId" value={user.supporterId} />
                <input type="hidden" name="userId" value={user.id} />
                <button
                type="submit"
                className={`btn btn-primary btn-lg ${isProduction ? 'disabled' : ''}`}
                style={{
                  display: 'block',
                  opacity: isProduction ? 0.5 : 1,
                  cursor: isProduction ? 'not-allowed' : 'pointer'
                }}
                title={isProduction ? "This feature is not available in production" : "応援する"}
                disabled={isProduction}
                >
                  応援する
                </button>
              </form>
            </div>
          )
        }
      </header>
      <TabNavigation 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth} 
        setShowYear={setShowYear} 
        allMonthArr={allMonthArr} 
        year={year} 
      />
      <UserRankingClient
        initialData={initialRankingData}
        youtuberId={params.youtuberId}
        showYear={showYear}
        currentYear={year}
        selectedMonth={selectedMonth}
      />
    </div>
  )
}
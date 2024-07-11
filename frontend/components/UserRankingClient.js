'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { showMoney } from "@/app/lib/useful.js";
import Image from "next/image";
import { getSupportersRanking } from "@/app/lib/api.js";

export default function UserRankingClient({ initialData, youtuberId, showYear, currentYear, selectedMonth }) {
  const [topSupporters, setTopSupporters] = useState(initialData.top_supporters)
  const [totalAmount, setTotalAmount] = useState(initialData.total_amount)
  const [currentMonth, setCurrentMonth] = useState(selectedMonth)

  useEffect(() => {
    // console.log("currentMonth", currentMonth)
    console.log("showYear", showYear)
    if (currentMonth !== selectedMonth)  {
      getSupportersRanking(currentYear, selectedMonth, youtuberId, showYear)
        .then(data => {
          setTopSupporters(data.top_supporters)
          setTotalAmount(data.total_amount)
          setCurrentMonth(selectedMonth)
        })
        .catch(error => {
          console.error("error in userranking", error)
        })
    }
  }, [youtuberId, selectedMonth, showYear])

  return (
    <div>
      <div className="ms-3" >
        <h3>{showMoney(totalAmount)}</h3>
      </div>
      <table className="table table-hover table-striped">
        <thead>
          <tr>
            <th scope="col" style={{ paddingLeft: '20px' }} >#</th>
            <th scope="col" >Name</th>
            <th scope="col" >Amount</th>
          </tr>
        </thead>
        <tbody>
        {topSupporters.map(({supporterId, amount, supporterName, supporterIconUrl, supporterCustomUrl}, idx) => (
            <tr key={supporterId}>
              <th scope="row" style={{ paddingLeft: '20px' }}>{idx+1}</th>
              <td className="d-flex align-items-center">
                <Image
                src={supporterIconUrl}
                alt={`${supporterName}'s icon`}
                style={{ marginRight: '10px' }}
                width={20}
                height={20}
                unoptimized
                />
                <Link href={`/supporters/${supporterId}`} className="me-2">{supporterName}</Link>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {supporterCustomUrl}
                </div>
              </td>
              <td>{showMoney(amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
"use client";

import { useState, useEffect } from "react";
import TabNavigation from "@/components/TabNavigation";
import RankingTable from "@/components/RankingTable.js"
import {
  getYoutubersRanking,
  getAllSupportersRanking,
} from "@/app/lib/api";

/* ================================================
 *  Home（ランキング一覧）
 * ==============================================*/
export default function ClientHome({ initialYoutubers, initialSupporters }) {
  /* ─── 今日の日付 ─── */
  const today        = new Date();
  const thisYear     = today.getFullYear();
  const thisMonthStr = String(today.getMonth() + 1).padStart(2, "0");

  /* ───  state  ─── */
  const [selectedYear,  setSelectedYear]  = useState(thisYear);
  const [selectedMonth, setSelectedMonth] = useState(thisMonthStr);
  const [showYear,      setShowYear]      = useState(false); // false = 月間
  const [showSupporter, setShowSupporter] = useState(true);  // true  = Supporter

  const [loading,    setLoading]    = useState(false);
  const [youtubers,  setYoutubers]  = useState(initialYoutubers);
  const [supporters, setSupporters] = useState(initialSupporters);

  /* ─── 年・月 選択肢 ─── */
  const earliestYear = 2024;
  const yearsArr = Array.from(
    { length: thisYear - earliestYear + 1 },
    (_, i) => thisYear - i          // 2025, 2024 …
  );

  const maxMonth = selectedYear === thisYear ? thisMonthStr : "12";
  const allMonthArr = Array.from(
    { length: parseInt(maxMonth, 10) },
    (_, i) => String(parseInt(maxMonth, 10) - i).padStart(2, "0")
  );

  /* ─── データ取得 ─── */
  useEffect(() => {
    setLoading(true);

    const fetcher = showSupporter
      ? getAllSupportersRanking
      : getYoutubersRanking;

    fetcher(selectedYear, selectedMonth, showYear)
      .then((data) => {
        if (showSupporter) setSupporters(data);
        else               setYoutubers(data);
      })
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth, showYear, showSupporter]);

  /* ─── 画面 ─── */
  return (
    <div className="container-fluid pt-4">

      {/* ==== フィルター ==== */}
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

      {/* ==== モード切替 ==== */}
      <div className="mb-3">
        <div className="btn-group">
          <button
            className={`btn btn-outline-primary ${!showSupporter && "active"}`}
            onClick={() => setShowSupporter(false)}
          >
            Youtubers
          </button>
          <button
            className={`btn btn-outline-primary ${showSupporter && "active"}`}
            onClick={() => setShowSupporter(true)}
          >
            Supporters
          </button>
        </div>
      </div>

      {/* ==== テーブル ==== */}
      {loading && <p className="text-center">Loading…</p>}

      {!loading && (
        <RankingTable
          list={showSupporter ? supporters : youtubers}
          variant={showSupporter ? "supporter-youtuber" : "youtuber-only"}
        />
      )}
    </div>
  );
}

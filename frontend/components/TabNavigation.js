"use client";

import React from "react";

/**
 * 期間フィルター（年 / 月）
 *  - 「月間」を選ぶと月セレクトも表示
 *  - 「年間合計」を選ぶと年だけを選択
 */
export default function TabNavigation({
  yearsArr,
  selectedYear,
  setSelectedYear,
  allMonthArr,
  selectedMonth,
  setSelectedMonth,
  showYear,
  setShowYear,
}) {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 my-4 px-3">

      {/* === 期間トグル ============================== */}
      <div className="btn-group me-2">
        <button
          className={`btn btn-outline-primary ${!showYear && "active"}`}
          onClick={() => setShowYear(false)}
        >
          月間
        </button>
        <button
          className={`btn btn-outline-primary ${showYear && "active"}`}
          onClick={() => setShowYear(true)}
        >
          年間合計
        </button>
      </div>

      {/* === 年セレクト ============================== */}
      <select
        className="form-select w-auto"
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
      >
        {yearsArr.map((y) => (
          <option key={y} value={y}>
            {y} 年
          </option>
        ))}
      </select>

      {/* === 月セレクト（月間のみ表示） =============== */}
      {!showYear && (
        <select
          className="form-select w-auto"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {allMonthArr.map((m) => (
            <option key={m} value={m}>
              {Number(m)} 月
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

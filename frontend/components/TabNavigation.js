"use client";

import React from "react";

/**
 * 年・月セレクタ
 *  - month を選べば 月間表示（showYear=false）
 *  - year を選べば 年間表示（showYear=true）
 */
export default function TabNavigation({
  yearsArr,
  selectedYear,
  setSelectedYear,
  allMonthArr,
  selectedMonth,
  setSelectedMonth,
  showYear,
  setShowYear
}) {
  return (
    <div className="mt-5 d-flex gap-2 align-items-center mb-4">

      {/* 月セレクト */}
      <select
        className="form-select w-auto"
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value);
          setShowYear(false);
        }}
      >
        {allMonthArr.map((m) => (
          <option key={m} value={m}>
            {Number(m)} 月
          </option>
        ))}
      </select>

      {/* 年セレクト */}
      <select
        className="form-select w-auto"
        value={selectedYear}
        onChange={(e) => {
          setSelectedYear(Number(e.target.value));
          setShowYear(true);
        }}
      >
        {yearsArr.map((y) => (
          <option key={y} value={y}>
            {y} 年
          </option>
        ))}
      </select>

      {/* 表示モード・バッジ */}
      <span className="badge bg-light text-muted ms-2">
        {showYear ? "年間合計" : "月間"}
      </span>
    </div>
  );
}

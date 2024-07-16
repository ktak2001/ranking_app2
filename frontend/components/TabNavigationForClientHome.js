"use client";

import React from "react";

export default function TabNavigation({
  selectedMonth,
  setSelectedMonth,
  setShowYear,
  allMonthArr,
  year,
  showYear,
  showYoutuberRanking,
  setShowYoutuberRanking,
  setShowSupporterRanking,
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <ul className="nav nav-tabs" id="myTab" role="tablist">
        <li className="nav-item dropdown">
          <button
            className="nav-link dropdown-toggle"
            data-bs-toggle="dropdown"
            role="button"
            aria-expanded="false"
          >
            {showYoutuberRanking ? "YouTuber" : "Supporter"}
          </button>
          <ul className="dropdown-menu">
            <li>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowYoutuberRanking(true);
                  setShowSupporterRanking(false);
                }}
              >
                YouTuber
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowYoutuberRanking(false);
                  setShowSupporterRanking(true);
                }}
              >
                Supporter
              </button>
            </li>
          </ul>
        </li>
        <li className="nav-item dropdown">
          <button
            className={`nav-link dropdown-toggle ${!showYear ? "active" : ""}`}
            data-bs-toggle="dropdown"
            role="button"
            aria-expanded="false"
          >
            {selectedMonth[0] == "0" ? selectedMonth[1] : selectedMonth}月
          </button>
          <ul className="dropdown-menu">
            {allMonthArr.map((el) => (
              <li key={el}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setSelectedMonth(el);
                    setShowYear(false);
                  }}
                >
                  {el[0] == "0" ? el[1] : el}月
                </button>
              </li>
            ))}
          </ul>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${showYear ? "active" : ""}`}
            id="profile-tab"
            data-bs-toggle="tab"
            data-bs-target="#profile-tab-pane"
            type="button"
            role="tab"
            aria-controls="profile-tab-pane"
            aria-selected={showYear}
            onClick={() => {
              setShowYear(true);
            }}
          >
            {year}年
          </button>
        </li>
      </ul>
    </div>
  );
}

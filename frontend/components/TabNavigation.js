"use client"

import React from "react";

export default function TabNavigation({ selectedMonth, setSelectedMonth, setShowYear, allMonthArr, year }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <ul className="nav nav-tabs" id="myTab" role="tablist">
        <li className="nav-item dropdown">
          <button className="nav-link dropdown-toggle" data-bs-toggle="dropdown" role="button" aria-expanded="false">{selectedMonth}</button>
          <ul className="dropdown-menu">
            {allMonthArr.map(el => (
              <li key={el}>
                <button className="dropdown-item" onClick={() => { setSelectedMonth(el); setShowYear(false); }}>{el}</button>
              </li>
            ))}
          </ul>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile-tab-pane" type="button" role="tab" aria-controls="profile-tab-pane" aria-selected="false" onClick={() => setShowYear(true)}>{year}</button>
        </li>
      </ul>
    </div>
  );
}

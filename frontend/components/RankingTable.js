"use client";

import YoutuberTableRow   from "./YoutuberTableRow";
import SupporterTableRow  from "./SupporterTableRow";

/**
 * mode: "youtuber" | "supporter"
 */
export default function RankingTable({ list, mode }) {
  return (
    <table className="table table-hover align-middle">
      <thead className="table-light">
        <tr>
          <th style={{ width: "60px" }}>#</th>

          {mode === "youtuber" ? (
            <>
              <th>VTuber</th>
              <th className="text-end">応援額</th>
              <th style={{ width: "30px" }}></th>
            </>
          ) : (
            <>
              <th>Supporter</th>
              <th>対象 VTuber</th>
              <th className="text-end">応援額</th>
              <th style={{ width: "30px" }}></th>
            </>
          )}
        </tr>
      </thead>

      <tbody>
        {list.map((item, i) =>
          mode === "youtuber" ? (
            <YoutuberTableRow key={item.youtuberId} rank={i + 1} data={item} />
          ) : (
            <SupporterTableRow key={item.supporterId} rank={i + 1} data={item} />
          )
        )}
      </tbody>
    </table>
  );
}

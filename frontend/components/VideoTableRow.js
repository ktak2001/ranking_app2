"use client";

import Link from "next/link";
import { showMoney } from "@/app/lib/useful";

export default function VideoTable({ list }) {
  return (
    <table className="table table-hover align-middle">
      <thead className="table-light">
        <tr>
          <th style={{ width: "60px" }}>#</th>
          <th>動画</th>
          <th className="text-end">応援額</th>
        </tr>
      </thead>
      <tbody>
        {list.map((item, i) => (
          <tr key={item.videoId}>
            {/* rank */}
            <td className="text-muted fw-semibold">{i + 1}</td>

            {/* thumbnail + title */}
            <td>
              <Link
                href={`https://www.youtube.com/watch?v=${item.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center gap-2 text-dark text-decoration-none"
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  width={40}
                  height={25}
                  style={{ objectFit: "cover" }}
                />
                <span>{item.title}</span>
              </Link>
            </td>

            {/* amount */}
            <td className="text-end fw-semibold">{showMoney(item.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

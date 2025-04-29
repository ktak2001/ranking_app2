"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { showMoney } from "@/app/lib/useful";
import SafeImage from "./SafeImage";

export default function SupporterWithYoutuberTable({ list }) {
  const router = useRouter();
  return (
    <table className="table table-hover align-middle">
      <thead className="table-light">
        <tr>
          <th style={{ width: "60px" }}>#</th>
          <th>Supporter</th>
          <th>対象 VTuber</th>
          <th className="text-end">応援額</th>
        </tr>
      </thead>

      <tbody>
        {list.map((item, i) => (
          <tr key={`${item.supporterId}-${item.youtuberId}`} className="border-bottom">
            {/* Rank */}
            <td className="text-muted fw-semibold border-bottom">{i + 1}</td>

            {/* Supporter */}
            <td
              className="hover:cursor-pointer"
              onClick={() => router.push(`/supporters/${item.supporterId}`)}
            >
              <Link
                href={`/supporters/${item.supporterId}`}
                className="d-flex align-items-center gap-2 text-dark text-decoration-none link-cell"
              >
                <SafeImage
                  src={item.supporterIconUrl}
                  fallbackSrc="/images/default-supporter.png"
                  alt={item.supporterName}
                  width={40}
                  height={40}
                  className="rounded-circle flex-shrink-0"
                  unoptimized
                />
                <span className="text-muted fw-medium">{item.supporterName}</span>
              </Link>
            </td>

            {/* Youtuber */}
            <td
              className="hover:cursor-pointer"
              onClick={() => router.push(`/youtubers/${item.youtuberId}`)}
            >
              <Link
                href={`/youtubers/${item.youtuberId}`}
                className="d-flex align-items-center gap-2 text-dark text-decoration-none link-cell"
              >
                <SafeImage
                  src={item.youtuberIconUrl}
                  fallbackSrc="/images/default-youtuber.png"
                  alt={item.youtuberName}
                  width={32}
                  height={32}
                  className="rounded-circle flex-shrink-0"
                  unoptimized
                />
                <span className="text-muted fw-medium">{item.youtuberName}</span>
              </Link>
            </td>

            {/* Amount */}
            <td className="text-end fw-semibold">{showMoney(item.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

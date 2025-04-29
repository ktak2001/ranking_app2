"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { showMoney } from "@/app/lib/useful";
import SafeImage from "./SafeImage";

/**
 * @param {Array} list  データ配列
 * @param {('supporter'|'youtuber')} entity  表示する主体
 */
export default function EntityAmountTable({ list, entity }) {
  const router = useRouter();
  console.log("list", list)
  console.log("entity", entity)
  return (
    <table className="table table-hover align-middle">
      <thead className="table-light">
        <tr>
          <th style={{ width: "60px" }}>#</th>
          <th>{entity === "supporter" ? "Supporter" : "VTuber"}</th>
          <th className="text-end">応援額</th>
        </tr>
      </thead>

      <tbody>
        {list.map((item, i) => {
          const isSupporter = entity === "supporter";
          const id   = isSupporter ? item.supporterId      : item.youtuberId;
          const name = isSupporter ? item.supporterName    : item.youtuberName;
          const icon = isSupporter ? item.supporterIconUrl : item.youtuberIconUrl;
          const href = isSupporter ? `/supporters/${id}`   : `/youtubers/${id}`;

          return (
            <tr key={id} className="border-bottom">
              {/* Rank */}
              <td className="text-muted fw-semibold border-bottom">{i + 1}</td>

              {/* Name & icon */}
              <td
                className="hover:cursor-pointer"
                onClick={() => router.push(href)}
              >
                <Link
                  href={href}
                  className="d-flex align-items-center gap-2 text-dark text-decoration-none link-cell"
                >
                  <SafeImage
                    src={icon}
                    fallbackSrc={isSupporter ? "/images/default-supporter.png" : "/images/default-youtuber.png"}
                    alt={name}
                    width={40}
                    height={40}
                    className="rounded-circle flex-shrink-0"
                    unoptimized
                  />
                  <span className="text-muted fw-medium">{name}</span>
                </Link>
              </td>

              {/* Amount */}
              <td className="text-end fw-semibold">{showMoney(item.amount)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
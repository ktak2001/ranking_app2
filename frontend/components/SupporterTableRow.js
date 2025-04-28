import Link      from "next/link";
import { showMoney } from "@/app/lib/useful";
import SafeImage from "./SafeImage";

/**
 * サポーター用 1 行
 */
export default function SupporterTableRow({ rank, data }) {
  return (
    <tr className="border-bottom">

      {/* ランク番号 */}
      <td className="text-muted fw-semibold">{rank}</td>

      {/* Supporter */}
      <td>
        <div className="d-flex align-items-center gap-2">
          <SafeImage
            src={data.supporterIconUrl}
            fallbackSrc="/images/default-supporter.png"
            alt={data.supporterName}
            width={40}
            height={40}
            className="rounded-circle flex-shrink-0"
            unoptimized
          />
          {data.supporterName}
        </div>
      </td>

      {/* 対象 VTuber */}
      <td>
        <div className="d-flex align-items-center gap-2">
          <SafeImage
            src={data.youtuberIconUrl}
            fallbackSrc="/images/default-youtuber.png"
            alt={data.youtuberName}
            width={28}
            height={28}
            className="rounded-circle flex-shrink-0"
            unoptimized
          />
          <span className="text-muted fw-medium">{data.youtuberName}</span>
        </div>
      </td>

      {/* 金額 */}
      <td className="text-end fw-semibold">{showMoney(data.amount)}</td>

      {/* 操作 */}
      <td>
        <div className="d-flex gap-2">
          <Link href={`/supporters/${data.supporterId}`} className="btn btn-outline-primary btn-sm">
            SP 詳細
          </Link>
          <Link href={`/youtubers/${data.youtuberId}`} className="btn btn-outline-secondary btn-sm">
            VT 詳細
          </Link>
        </div>
      </td>
    </tr>
  );
}

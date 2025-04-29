import Link      from "next/link";
import { showMoney } from "@/app/lib/useful";
import SafeImage from "./SafeImage";
import { useRouter } from "next/navigation";
import "./Tables.css"

/**
 * サポーター用 1 行
 */
export default function SupporterTableRow({ rank, data }) {
  // const router = useRouter()
  return (
    <tr className="border-bottom">

      {/* ランク番号 */}
      <td className="text-muted fw-semibold">{rank}</td>

      {/* Supporter */}
      <td>
        <Link
          href={`/supporters/${data.supporterId}`}
          className="d-flex align-items-center gap-2 text-dark text-decoration-none link-cell"
        >
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
        </Link>
      </td>

      {/* 対象 VTuber */}
      <td>
        <Link
          href={`/youtubers/${data.youtuberId}`}
          className="d-flex align-items-center gap-2 text-dark text-decoration-none link-cell"
        >
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
        </Link>
      </td>

      {/* 金額 */}
      <td className="text-end fw-semibold">{showMoney(data.amount)}</td>
    </tr>
  );
}

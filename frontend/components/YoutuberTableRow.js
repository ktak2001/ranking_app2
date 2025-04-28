import Link      from "next/link";
import { showMoney } from "@/app/lib/useful";
import SafeImage from "./SafeImage";

/**
 * VTuber 用ランキング 1 行
 *
 * props
 *  ── rank : 1,2,3…
 *  ── data : { youtuberId, youtuberName, youtuberIconUrl, amount }
 */
export default function YoutuberTableRow({ rank, data }) {
  return (
    <tr className="border-bottom">

      {/* ランク番号 */}
      <td className="text-muted fw-semibold">{rank}</td>

      {/* VTuber */}
      <td>
        <div className="d-flex align-items-center gap-2">
          <SafeImage
            src={data.youtuberIconUrl}
            fallbackSrc="/images/default-youtuber.png"
            alt={data.youtuberName}
            width={40}
            height={40}
            className="rounded-circle flex-shrink-0"
            unoptimized
          />
          {data.youtuberName}
        </div>
      </td>

      {/* 応援額 */}
      <td className="text-end fw-semibold">{showMoney(data.amount)}</td>

      {/* 詳細 */}
      <td style={{ width: "120px" }}>
        <Link
          href={`/youtubers/${data.youtuberId}`}
          className="btn btn-outline-primary btn-sm w-100"
        >
          詳細
        </Link>
      </td>
    </tr>
  );
}

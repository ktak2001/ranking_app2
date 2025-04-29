import Link      from "next/link";
import { showMoney } from "@/app/lib/useful";
import SafeImage from "./SafeImage";
import { useRouter } from "next/navigation";
import "./Tables.css"

/**
 * VTuber 用ランキング 1 行
 *
 * props
 *  ── rank : 1,2,3…
 *  ── data : { youtuberId, youtuberName, youtuberIconUrl, amount }
 */
export default function YoutuberTableRow({ rank, data }) {
  const router = useRouter();
  return (
    <tr className="border-bottom">

      {/* ランク番号 */}
      <td className="text-muted fw-semibold border-bottom">{rank}</td>

      {/* VTuber */}
      <td
        className="hover:cursor-pointer"
        onClick={() => router.push(`/youtubers/${data.youtuberId}`)}
      >
        <Link
          href={`/youtubers/${data.youtuberId}`}
          className="d-flex align-items-center gap-2 text-dark text-decoration-none link-cell"
        >
          <SafeImage
            src={data.youtuberIconUrl}
            fallbackSrc="/images/default-youtuber.png"
            alt={data.youtuberName}
            width={40}
            height={40}
            className="rounded-circle flex-shrink-0"
            unoptimized
          />
          <span className="text-muted fw-medium">{data.youtuberName}</span>
        </Link>
      </td>

      {/* 応援額 */}
      <td className="text-end fw-semibold">{showMoney(data.amount)}</td>
    </tr>
  );
}

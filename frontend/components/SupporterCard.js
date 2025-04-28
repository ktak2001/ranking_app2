/* サポーター ランキングの 1 行分（テーブル行） */
import React from 'react';
import Link from 'next/link';
import { showMoney } from '@/app/lib/useful.js';
import SafeImage from './SafeImage.js';

export default function SupporterCard({ supporter, rank }) {
  return (
    <tr>
      {/* ランク番号 */}
      <th scope="row" style={{ width: '60px' }}>{rank}</th>

      {/* サポーター アイコン＋名前 */}
      <td>
        <div className="d-flex align-items-center gap-2">
          <SafeImage
            fallbackSrc="/images/default-supporter.png"
            src={supporter.supporterIconUrl}
            alt={supporter.supporterName}
            width={40}
            height={40}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
            unoptimized
          />
          <span>{supporter.supporterName}</span>
        </div>
      </td>

      {/* 対象 VTuber（アイコン＋名前） */}
      <td>
        <div className="d-flex align-items-center gap-2">
          <SafeImage
            fallbackSrc="/images/default-youtuber.png"
            src={supporter.youtuberIconUrl}
            alt={supporter.youtuberName}
            width={24}
            height={24}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
            unoptimized
          />
          <span className="small text-muted">{supporter.youtuberName}</span>
        </div>
      </td>

      {/* 応援額 */}
      <td className="text-end">{showMoney(supporter.amount)}</td>

      {/* 詳細ボタン */}
      <td style={{ width: '120px' }}>
        <div className="d-flex gap-1">
          <Link
            href={`/supporters/${supporter.supporterId}`}
            className="btn btn-primary btn-sm flex-fill"
          >
            SP 詳細
          </Link>
          <Link
            href={`/youtubers/${supporter.youtuberId}`}
            className="btn btn-outline-primary btn-sm flex-fill"
          >
            VT 詳細
          </Link>
        </div>
      </td>
    </tr>
  );
}

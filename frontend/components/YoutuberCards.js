/* VTuber ランキングの 1 行分（テーブル行） */
import React from 'react';
import Link from 'next/link';
import { showMoney } from '@/app/lib/useful.js';
import SafeImage from './SafeImage.js';

export default function YoutuberCard({ youtuber, rank }) {
  return (
    <tr>
      {/* ランク番号 */}
      <th scope="row" style={{ width: '60px' }}>{rank}</th>

      {/* アイコン＋名前 */}
      <td>
        <div className="d-flex align-items-center gap-2">
          <SafeImage
            fallbackSrc="/images/default-youtuber.png"
            src={youtuber.youtuberIconUrl}
            alt={youtuber.youtuberName}
            width={40}
            height={40}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
            unoptimized
          />
          <span>{youtuber.youtuberName}</span>
        </div>
      </td>

      {/* 応援額 */}
      <td className="text-end">{showMoney(youtuber.amount)}</td>

      {/* 詳細ボタン */}
      <td style={{ width: '120px' }}>
        <Link
          href={`/youtubers/${youtuber.youtuberId}`}
          className="btn btn-outline-primary btn-sm w-100"
        >
          詳細を見る
        </Link>
      </td>
    </tr>
  );
}

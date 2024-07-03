import React from 'react'
import Link from 'next/link'
import { showMoney } from '@/app/lib/useful.js'
import Image from 'next/image'

export default function YoutuberCard({ youtuber, inSupporterPage }) {
    return (
      <div className="card" style={{ width: '18rem' }} >
        <div style={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
          <Image
            src={youtuber.youtuberIconUrl}
            alt={youtuber.youtuberName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{
              objectFit: 'cover',
            }}
            unoptimized
          />
        </div>
        <div className="card-body">
          <h4 className="card-title">{youtuber.youtuberName}</h4>
          <h5 className="card-text">{showMoney(youtuber.amount)}</h5>
          {inSupporterPage && youtuber.supporterRank != 0 && (
            <h5 className="card-text">No. {youtuber.supporterRank} supporter</h5>
          )}
          {inSupporterPage && youtuber.supporterRank == 0 && (
            <h5 className="card-text">圏外</h5>
          )}
          <Link href={`/youtubers/${youtuber.youtuberId}`} className="btn btn-primary">詳細を見る</Link>
        </div>
      </div>
    )
}
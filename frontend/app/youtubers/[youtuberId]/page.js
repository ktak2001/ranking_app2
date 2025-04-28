import YoutuberDetailsClient from './YoutuberDetailsClient.js';
import { getYoutuberInfo, getSupportersRanking } from '@/app/lib/api';
import { yearMonth } from "@/app/lib/useful.js";

export async function generateMetadata({ params }) {
  const youtuberInfo = await getYoutuberInfo(params.youtuberId);
  return {
    title: `${youtuberInfo.youtuberName} | VTuber投げ銭詳細`,
    description: `${youtuberInfo.youtuberName}のVTuber投げ銭情報と支援者ランキング。月間の投げ銭額やファン数などの詳細統計を確認できます。`,
    openGraph: {
      title: `${youtuberInfo.youtuberName} | VTuber投げ銭ランキング`,
      description: `${youtuberInfo.youtuberName}のVTuber投げ銭情報と支援者ランキング。月間の投げ銭額やファン数などの詳細統計を確認できます。`,
      url: `https://virtual-youtuber-nagesen.com/youtubers/${params.youtuberId}`,
      images: [
        {
          url: youtuberInfo.youtuberIconUrl,
          width: 1200,
          height: 630,
          alt: youtuberInfo.youtuberName,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${youtuberInfo.youtuberName} | VTuber投げ銭ランキング`,
      description: `${youtuberInfo.youtuberName}のVTuber投げ銭情報と支援者ランキング。月間の投げ銭額やファン数などの詳細統計を確認できます。`,
      images: [youtuberInfo.youtuberIconUrl],
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function YoutuberDetailsPage({ params }) {
  const {year, month} = yearMonth()
  const youtuberInfo = await getYoutuberInfo(params.youtuberId);
  const initialRankingData = await getSupportersRanking(year, month, params.youtuberId, false);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": `https://virtual-youtuber-nagesen.com/youtubers/${params.youtuberId}`,
            name: youtuberInfo.youtuberName,
            description:
              `${youtuberInfo.youtuberName}のVTuber投げ銭情報ページ`,
            image: youtuberInfo.youtuberIconUrl,
            url: `https://virtual-youtuber-nagesen.com/youtubers/${params.youtuberId}`,
            sameAs: [
              youtuberInfo.youtuberChannelUrl,
              // 他のSNSリンクがあれば追加
            ],
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://virtual-youtuber-nagesen.com/youtubers/${params.youtuberId}`,
            },
          }),
        }}
      />
      <YoutuberDetailsClient
        initialData={{ youtuberInfo, rankingData: initialRankingData }}
        params={params}
      />
    </>
  );
}
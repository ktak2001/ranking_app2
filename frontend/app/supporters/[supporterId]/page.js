import SupporterDetailsClient from './SupporterDetailsClient.js';
import { getSupporterInfo } from '@/app/lib/api';

// Simple in-memory cache
const cache = new Map();

async function getCachedSupporterInfo(supporterId) {
  if (!cache.has(supporterId)) {
    const supporterInfo = await getSupporterInfo(supporterId);
    cache.set(supporterId, supporterInfo);
  }
  return cache.get(supporterId);
}

export async function generateMetadata({ params }) {
  const supporterInfo = await getCachedSupporterInfo(params.supporterId);
  return {
    title: `${supporterInfo.supporterName} | VTuber支援者プロフィール`,
    description: `${supporterInfo.supporterName}のVTuber支援活動プロフィール。月間・年間の投げ銭額、支援したVTuberのリストなどの詳細情報を確認できます。`,
    openGraph: {
      title: `${supporterInfo.supporterName} | VTuber支援者プロフィール`,
      description: `${supporterInfo.supporterName}のVTuber支援活動プロフィール。月間・年間の投げ銭額、支援したVTuberのリストなどの詳細情報を確認できます。`,
      url: `https://virtual-youtuber-nagesen.com/supporters/${params.supporterId}`,
      images: [
        {
          url: supporterInfo.supporterIconUrl,
          width: 200,
          height: 200,
          alt: `${supporterInfo.supporterName}のプロフィール画像`,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${supporterInfo.supporterName} | VTuber支援者プロフィール`,
      description: `${supporterInfo.supporterName}のVTuber支援活動プロフィール。月間・年間の投げ銭額、支援したVTuberのリストなどの詳細情報を確認できます。`,
      images: [supporterInfo.supporterIconUrl],
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function SupporterDetailsPage({ params }) {
  const supporterInfo = await getCachedSupporterInfo(params.supporterId);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": `https://virtual-youtuber-nagesen.com/supporters/${params.supporterId}`,
            name: supporterInfo.supporterName,
            description: `VTuber支援者 ${supporterInfo.supporterName}のプロフィールページ`,
            image: supporterInfo.supporterIconUrl,
            url: `https://virtual-youtuber-nagesen.com/supporters/${params.supporterId}`,
            sameAs: [
              `https://www.youtube.com/channel/${supporterInfo.supporterId}`,
              // 他のSNSリンクがあれば追加
            ],
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://virtual-youtuber-nagesen.com/supporters/${params.supporterId}`,
            },
            interactionStatistic: {
              "@type": "InteractionCounter",
              interactionType: "https://schema.org/MonetaryDonation",
              userInteractionCount: supporterInfo.totalDonations || "未公開",
            },
          }),
        }}
      />
      <SupporterDetailsClient supporterInfo={supporterInfo} params={params} />
    </>
  );
}
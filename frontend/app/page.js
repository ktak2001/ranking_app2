import { yearMonth } from "./lib/useful.js";
import ClientHome from "./ClientHome.js";
import { getYoutubersRanking, getAllSupportersRanking } from "./lib/api.js";

export const metadata = {
  title: "VTuber投げ銭ランキング",
  description:
    "バーチャルYouTuberへの投げ銭ランキングを提供。VTuberへの投げ銭の月間ランキングを確認できます。",
  keywords: "VTuber, バーチャルYouTuber, 投げ銭, ランキング, ライブ配信, 支援",
  openGraph: {
    title: "VTuber投げ銭ランキング | バーチャルYouTuber支援サイト",
    description:
      "バーチャルYouTuberへの投げ銭ランキングを提供。VTuberへの投げ銭の月間ランキングを確認できます。",
    url: "https://virtual-youtuber-nagesen.com",
    siteName: "VTuber投げ銭ランキング",
    images: [
      {
        url: "/images/site_image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VTuber投げ銭ランキング | バーチャルYouTuber支援サイト",
    description:
      "バーチャルYouTuberへの投げ銭ランキングを提供。VTuberへの投げ銭の月間ランキングを確認できます。",
    images: ["images/site_image.png"],
  },
};

export const dynamic = 'force-dynamic';

export default async function Home() {
  const {year, month} = yearMonth()
  const initialYoutubers = await getYoutubersRanking(year, month, false)
  const initialSupporters = await getAllSupportersRanking(year, month, false)
  return <ClientHome initialYoutubers={initialYoutubers} initialSupporters={initialSupporters} year={year} month={month} />
}
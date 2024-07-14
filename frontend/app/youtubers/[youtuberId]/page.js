import YoutuberDetailsClient from './YoutuberDetailsClient.js';
import { getYoutuberInfo, getSupportersRanking } from '@/app/lib/api';
import { yearMonth } from "@/app/lib/useful.js";

export async function generateMetadata({ params }) {
  const youtuberInfo = await getYoutuberInfo(params.youtuberId);
  return {
    title: youtuberInfo.youtuberName,
    // Add other metadata as needed
  };
}

export const dynamic = 'force-dynamic';

export default async function YoutuberDetailsPage({ params }) {
  const {year, month} = yearMonth()
  const youtuberInfo = await getYoutuberInfo(params.youtuberId);
  const initialRankingData = await getSupportersRanking(year, month, params.youtuberId, false);

  return <YoutuberDetailsClient initialData={{youtuberInfo, rankingData: initialRankingData}} params={params} />;
}
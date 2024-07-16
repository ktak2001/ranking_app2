import { yearMonth } from "./lib/useful.js";
import ClientHome from "./ClientHome.js";
import { getYoutubersRanking, getAllSupportersRanking } from "./lib/api.js";

export const metadata = {
  title: "VTuber投げ銭ランキング"
}

export const dynamic = 'force-dynamic';

export default async function Home() {
  const {year, month} = yearMonth()
  const initialYoutubers = await getYoutubersRanking(year, month, false)
  const initialSupporters = await getAllSupportersRanking(year, month, false)
  return <ClientHome initialYoutubers={initialYoutubers} initialSupporters={initialSupporters} year={year} month={month} />
}
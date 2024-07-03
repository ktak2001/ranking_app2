import { yearMonth } from "./lib/useful.js";
import ClientHome from "./ClientHome.js";
import { getYoutubersRanking } from "./lib/api.js";

export const metadata = {
  title: "YoutuberRanking"
}

export const dynamic = 'force-dynamic';

export default async function Home() {
  const {year, month} = yearMonth()
  const initialYoutubers = await getYoutubersRanking(year, month)
  return <ClientHome initialYoutubers={initialYoutubers} year={year} month={month} />
}
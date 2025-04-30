"use client";

import EntityAmountTable          from "./EntityAmountTable";
import SupporterWithYoutuberTable from "./SupporterWithYoutuberTable";
import VideoTable                 from "./VideoTableRow";          // ★ new

/**
 * variant:
 *   "supporter-youtuber" | "supporter-only" | "youtuber-only" | "video-only"
 */
export default function RankingTable({ variant, list }) {
  switch (variant) {
    case "supporter-youtuber":
      return <SupporterWithYoutuberTable list={list} />;

    case "supporter-only":
      return <EntityAmountTable entity="supporter" list={list} />;

    case "youtuber-only":
      return <EntityAmountTable entity="youtuber" list={list} />;

    case "video-only":                                  // ★ added
      return <VideoTable list={list} />;

    default:
      return null;
  }
}

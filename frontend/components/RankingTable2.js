"use client";

import EntityAmountTable           from "./EntityAmountTable";
import SupporterWithYoutuberTable  from "./SupporterWithYoutuberTable";

/**
 * variant: "supporter-only" | "youtuber-only" | "supporter-youtuber"
 */
export default function RankingTable({ variant, list }) {
  switch (variant) {
    case "supporter-youtuber":
      return <SupporterWithYoutuberTable list={list} />;

    case "supporter-only":
      return <EntityAmountTable entity="supporter" list={list} />;

    case "youtuber-only":           // ← ここ
      return <EntityAmountTable entity="youtuber" list={list} />;

    default:
      return null;
  }
}

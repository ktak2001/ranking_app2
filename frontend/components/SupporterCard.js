import React from "react";
import Link from "next/link";
import { showMoney } from "@/app/lib/useful.js";
import Image from "next/image";

export default function SupporterCard({ supporter }) {
  return (
    <div className="card shadow-sm" style={{ width: "18rem" }}>
      <div style={{ position: "relative", width: "100%", paddingTop: "100%" }}>
        <Image
          src={supporter.supporterIconUrl}
          alt={supporter.supporterName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{
            objectFit: "cover",
          }}
          unoptimized
        />
      </div>
      <div className="card-body p-3">
        <h4 className="card-title mb-2">{supporter.supporterName}</h4>
        <h5 className="card-text mb-3">
          応援額: {showMoney(supporter.amount)}
        </h5>
        <div className="d-flex align-items-center mb-3">
          <div
            style={{
              width: "40px",
              height: "40px",
              position: "relative",
              marginRight: "10px",
              overflow: "hidden",
              borderRadius: "50%",
            }}
          >
            <Image
              src={supporter.youtuberIconUrl}
              alt={supporter.youtuberName}
              fill
              style={{
                objectFit: "cover",
              }}
              unoptimized
            />
          </div>
          <span>対象VTuber: {supporter.youtuberName}</span>
        </div>
        <div className="d-grid gap-2">
          <Link
            href={`/youtubers/${supporter.youtuberId}`}
            className="btn btn-outline-primary btn-sm"
          >
            VTuberの詳細を見る
          </Link>
          <Link
            href={`/supporters/${supporter.supporterId}`}
            className="btn btn-primary btn-sm"
          >
            このサポーターの詳細を見る
          </Link>
        </div>
      </div>
    </div>
  );
}

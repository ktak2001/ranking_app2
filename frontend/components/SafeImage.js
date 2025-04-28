"use client";

import Image from "next/image";
import { useState } from "react";

/**
 *  remote 画像が 404 / 403 などで表示できなかった場合だけ
 *  fallbackSrc に差し替える Image コンポーネント
 */
export default function SafeImage({
  src,
  fallbackSrc,
  ...rest
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  console.log("srcs", src, fallbackSrc)
  return (
    <Image
      {...rest}
      src={currentSrc}
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  );
}

"use client";
import { generateCodeVerifier, generateCodeChallenge } from "../app/lib/youtubeOauth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function YoutubeLoginButton() {
  const router = useRouter();
  const [loading,setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const verifier  = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    // 記憶
    sessionStorage.setItem("yt_code_verifier", verifier);

    const params = new URLSearchParams({
      client_id: '208750319210-op24irglip1eorvs6pc41qf1lono0ti6.apps.googleusercontent.com',
      redirect_uri: `${process.env.NEXT_PUBLIC_WEB_URL}/youtube/callback`,
      response_type: "code",
      code_challenge_method: "S256",
      code_challenge: challenge,
      scope: "https://www.googleapis.com/auth/youtube.readonly",
      access_type: "offline",
      include_granted_scopes: "true",
      state: crypto.randomUUID(),
    });
    window.location.assign(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
  };

  return (
    <button className="btn-pill-blue" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting…" : "YouTube を連携"}
    </button>
  );
}

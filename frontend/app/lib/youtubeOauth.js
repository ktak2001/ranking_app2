// lib/youtubeOauth.js
import { nanoid } from "nanoid";

// 43〜128文字の code_verifier を生成
export function generateCodeVerifier(){
  return nanoid(96);
}

// SHA256 → Base64URL
function base64urlencode(str){
  return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function generateCodeChallenge(verifier){
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlencode(digest);
}

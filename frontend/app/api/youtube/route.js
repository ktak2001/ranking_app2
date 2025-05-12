// app/api/youtube/route.js
import { NextResponse } from "next/server";
import axios from "axios";
import { adminAuth, adminDB } from "../../lib/firebaseAdmin";

export async function POST(req){
  const { code, verifier } = await req.json();
  try{
    const params = new URLSearchParams({
      client_id: '208750319210-op24irglip1eorvs6pc41qf1lono0ti6.apps.googleusercontent.com',
      client_secret: process.env.YT_CLIENT_SECRET,
      redirect_uri: process.env.WEB_BASE_URL + "/youtube/callback",
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
    });
    console.log({params})
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      params.toString(),
      { headers:{ "Content-Type":"application/x-www-form-urlencoded" } }
    );
    console.log({data})
    // ★YouTube API で自分のチャンネル ID を取得
    const { data: ch } = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params:{ part:"id", mine:"true", access_token:data.access_token }
      }
    );
    console.log({ch})
    const supporterId = ch.items[0].id;

    // ★Firebase に保存（Auth でログイン済みと仮定）
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("Authorization header missing");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const { uid } = await adminAuth.verifyIdToken(idToken);
    await adminDB.collection("users").doc(uid).set({ supporterId }, { merge:true });
    await adminDB.collection("supporters").doc(supporterId).set({ connectedUser: uid }, { merge:true });

    return NextResponse.json({ supporterId });
  }catch(e){
    console.error(e.response?.data || e.message);
    return NextResponse.json({ error:"token_exchange_failed" }, { status:500 });
  }
}

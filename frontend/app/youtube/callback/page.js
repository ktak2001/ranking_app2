"use client";
export const dynamic = "force-dynamic";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  getFirestore
} from "firebase/firestore";
import { auth } from "../../lib/firebaseConfig";
import { useAuth, useSetAuth } from "../../lib/auth";

function CallbackInner() {
  const router = useRouter();
  const sp     = useSearchParams();
  const user   = useAuth();
  const setUser = useSetAuth();
  const db     = getFirestore();

  useEffect(() => {
    const code   = sp.get("code");
    const error  = sp.get("error");
    if (error) { router.replace("/?yt_error=" + error); return; }

    const verifier = sessionStorage.getItem("yt_code_verifier");
    if (!verifier) { router.replace("/?yt_error=noverifier"); return; }

    // ユーザー確定用 Promise
    const waitForLogin = () =>
      new Promise((resolve, reject) =>
        onAuthStateChanged(auth, (u) => { if (u) resolve(u); }, reject)
      );

    (async () => {
      let currentUser = user || await waitForLogin();

      // 未ログインならポップアップでサインイン
      if (!currentUser) {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        currentUser = res.user;
      }

      /* -------- API へトークン交換リクエスト -------- */
      const idToken = await currentUser.getIdToken(true);
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ code, verifier }),
      });
      if (!res.ok) { router.replace("/?yt_error=token"); return; }
      const { supporterId } = await res.json();
      setUser((u) => u ? { ...u, supporterId } : u);
      /* -------- Firestore の反映を待つ -------- */
      const unSub = onSnapshot(
        doc(db, "users", currentUser.uid),
        (snap) => {
          const data = snap.data();
          if (data?.supporterId) {
            unSub();
            router.replace(`/supporters/${data.supporterId}`);
          }
        },
        (err) => { console.error(err); unSub(); }
      );
    })();
  }, []);

  return null;         // Suspense の fallback が表示される
}

export default function Page() {
  return (
    <Suspense fallback={<p style={{padding:16}}>連携処理中…</p>}>
      <CallbackInner />
    </Suspense>
  );
}

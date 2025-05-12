import admin from "firebase-admin";

const projectId   = "ranking-app-bf2df";
const clientEmail = "firebase-adminsdk-vtb8n@ranking-app-bf2df.iam.gserviceaccount.com";
let   privateKey  = process.env.FB_PRIVATE_KEY;

// Secret Manager を使わず hosting.environment で "\n" エスケープしている場合だけ復元
if (privateKey?.includes("\\n")) {
  privateKey = privateKey.replace(/\\n/g, "\n");
}

/* ─── 既存 "custom" App を再利用、無ければ作成 ─── */
const app =
  admin.apps.find((a) => a.name === "custom") ||
  admin.initializeApp(
    { credential: admin.credential.cert({ projectId, clientEmail, privateKey }) },
    "custom"                    // ★ 名前付きで初期化
  );

console.log(`✅ firebase-admin app "${app.name}" ready`);

/* ─── 必ず "custom" App からサービスを取得 ─── */
export const adminAuth = app.auth();
export const adminDB   = app.firestore();

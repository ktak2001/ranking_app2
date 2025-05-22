// app/privacy/page.tsx
export const metadata = { title:"プライバシーポリシー / Privacy Policy" };

export default function Privacy() {
  return (
    <main className="container mx-auto px-4 py-8 prose">
      <h1>プライバシーポリシー</h1>
      <p>
        当サイト（以下「本サイト」）では、Google AdSense などの第三者配信事業者が
        Cookie を使用し、ユーザーの過去の閲覧履歴に基づく広告を表示します。
        Cookie により収集される情報には、氏名・メールアドレスなど
        個人を特定できる情報は含まれません。
      </p>
      <p>
        Users can disable personalised advertising in
        <a href="https://www.google.com/settings/ads">Google Ads Settings</a>.
        For more details, please read
        <a href="https://policies.google.com/technologies/ads">How Google uses cookies in advertising</a>.
      </p>

      <h2>収集する情報 / Data we collect</h2>
      <ul>
        <li>IP アドレス・ブラウザ情報 (for analytics)</li>
        <li>Firebase 認証情報 (when you sign in)</li>
      </ul>

      <h2>お問い合わせ / Contact</h2>
      <p>Email: info@opensuperchat.com</p>
    </main>
  );
}

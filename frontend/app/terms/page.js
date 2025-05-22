export const metadata = { title:"利用規約 / Terms of Service" };

export default function Terms() {
  return (
    <main className="container mx-auto px-4 py-8 prose">
      <h1>利用規約</h1>
      <p>
        本サイトは VTuber のスーパーチャット金額を集計して提供します。
        本サイトの情報を利用した結果生じた損害について、運営者は一切の責任を
        負いません。All content is provided “as is” without warranties.
      </p>

      <h2>禁止事項 / Prohibited actions</h2>
      <ul>
        <li>自動化ツールによる過度なスクレイピング</li>
        <li>サービスの妨害行為</li>
      </ul>

      <h2>準拠法 / Governing law</h2>
      <p>準拠法は日本法とし、紛争は東京地方裁判所を第一審専属管轄裁判所とします。</p>
    </main>
  );
}

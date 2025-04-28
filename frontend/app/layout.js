import "bootstrap/dist/css/bootstrap.min.css";
import { Inter } from "next/font/google";
import AuthProviderClient from "../components/AuthProviderClient";
import Header from "../components/Header";
import BootstrapClient from "@/components/BootstrapClient.js";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "VTuber投げ銭ランキング",
  description:
    "バーチャルYouTuberへの投げ銭ランキングを提供。VTuberへの投げ銭の月間ランキングを確認できます。",
  keywords: "VTuber, バーチャルYouTuber, 投げ銭, ランキング, ライブ配信, 支援",
  openGraph: {
    title: "VTuber投げ銭ランキング | バーチャルYouTuber支援サイト",
    description:
      "バーチャルYouTuberへの投げ銭ランキングを提供。VTuberへの投げ銭の月間ランキングを確認できます。",
    url: "https://virtual-youtuber-nagesen.com",
    siteName: "VTuber投げ銭ランキング",
    images: [
      {
        url: "/images/site_image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VTuber投げ銭ランキング | バーチャルYouTuber支援サイト",
    description:
      "バーチャルYouTuberへの投げ銭ランキングを提供。VTuberへの投げ銭の月間ランキングを確認できます。",
    images: ["/images/site_image.png"],
  },
  metadataBase: new URL("https://virtual-youtuber-nagesen.com"),
};

export default function RootLayout({ children }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VTuber投げ銭ランキング",
    url: "https://virtual-youtuber-nagesen.com",
    logo: "/images/site_image.png",
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VTuber投げ銭ランキング",
    url: "https://virtual-youtuber-nagesen.com",
  };

  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <link rel="icon" href="/images/site_image.png" type="image/png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={inter.className}>
        <AuthProviderClient>
          <Header />
          {children}
        </AuthProviderClient>
        <BootstrapClient />
      </body>
    </html>
  );
}

import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/globals.css"
import { Inter } from "next/font/google";
import AuthProviderClient from "../components/AuthProviderClient";
import Header from "../components/Header";
import BootstrapClient from "@/components/BootstrapClient.js";
import Script from "next/script";
import {YouTubeAuthProvider} from "../components/YoutubeAuthProvider.js"

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "VTuber投げ銭 視聴者ランキング",
  description:
    "バーチャルYouTuberへの投げ銭ランキングを提供。VTuberへの投げ銭の月間ランキングを確認できます。",
  keywords: "VTuber, バーチャルYouTuber, 投げ銭, ランキング, ライブ配信, 支援",
  openGraph: {
    title: "VTuber投げ銭 視聴者ランキング",
    description:
      "VTuberへの投げ銭額の視聴者ランキングを提供",
    url: "https://opensuperchat.com",
    siteName: "VTuber投げ銭 視聴者ランキング",
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
    title: "VTuber投げ銭 視聴者ランキング",
    description:
      "VTuberへの投げ銭額の視聴者ランキングを提供",
    images: ["/images/site_image.png"],
  },
  metadataBase: new URL("https://opensuperchat.com"),
};

export default function RootLayout({ children }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VTuber投げ銭 視聴者ランキング",
    url: "https://opensuperchat.com",
    logo: "/images/site_image.png",
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VTuber投げ銭 視聴者ランキング",
    url: "https://opensuperchat.com",
  };

  return (
    <html lang="en">
      <head>
        <meta
          name="google-adsense-account"
          content="ca-pub-7195171741009182"
        />
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
        <Script
          id="ga-src"
          src="https://www.googletagmanager.com/gtag/js?id=G-444598252"
          strategy="afterInteractive"
          data-cookieconsent="ignore"
        />
        <Script
          id="ga-init"
          strategy="afterInteractive"
        >{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied'});
          gtag('js', new Date());
          gtag('config','G-444598252',{ anonymize_ip:true });
        `}</Script>
      </head>
      <body className={inter.className}>
        <AuthProviderClient>
          <YouTubeAuthProvider>
            <Header />
            {children}
          </YouTubeAuthProvider>
        </AuthProviderClient>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7195171741009182"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <BootstrapClient />
      </body>
    </html>
  );
}

import Script from "next/script";
import "./globals.css";

const BRAND_NAME = "장터모아";

export const metadata = {
  title: BRAND_NAME,
  description: "당근마켓, 중고나라, 번개장터를 한 번에 검색하는 중고거래 통합 웹 앱",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <Script
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7152371441049509"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

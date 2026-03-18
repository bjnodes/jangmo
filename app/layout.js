import Link from "next/link";
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
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7152371441049509"
     crossorigin="anonymous"></script>
      </head>
      <body>
        <header className="global-header">
          <div className="global-header__inner">
            <Link href="/" className="global-home-link" aria-label={`${BRAND_NAME} 홈으로 이동`}>
              <img src="/jangteomoa-logo.png" alt={`${BRAND_NAME} 로고`} />
              <span className="global-home-link__brand">{BRAND_NAME}</span>
            </Link>
            <p className="global-header__tagline">손쉽고 간편하게 모든 중고플랫폼을 한 번에 검색!</p>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </body>
    </html>
  );
}

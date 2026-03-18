import "./globals.css";

const BRAND_NAME = "장터모아";

export const metadata = {
  title: BRAND_NAME,
  description: "중고거래 통합검색과 판매 초안 작성 웹 앱",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

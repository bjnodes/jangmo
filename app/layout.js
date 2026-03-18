import "./globals.css";

const BRAND_NAME = "\uC7A5\uD130\uBAA8\uC544";

export const metadata = {
  title: BRAND_NAME,
  description: "\uC911\uACE0\uAC70\uB798 \uD1B5\uD569\uAC80\uC0C9\uACFC \uD310\uB9E4 \uCD08\uC548 \uC791\uC131 \uC6F9 \uC571",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

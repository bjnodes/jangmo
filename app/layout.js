import "./globals.css";

const BRAND_NAME = "\uC7A5\uD130\uBAA8\uC544";

export const metadata = {
  title: BRAND_NAME,
  description: "Unified secondhand search and seller draft workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

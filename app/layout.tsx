import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Al Baaqir | Premium Belts & Bags",
  description: "Luxury belts and bags for refined everyday style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col brand-page">{children}</body>
    </html>
  );
}

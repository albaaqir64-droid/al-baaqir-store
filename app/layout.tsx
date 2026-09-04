import type { Metadata } from "next";
import "./globals.css";
import ClientAnalytics from "./components/ClientAnalytics";

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
      <body className="min-h-full flex flex-col brand-page">
        <ClientAnalytics />
        {children}
      </body>
    </html>
  );
}

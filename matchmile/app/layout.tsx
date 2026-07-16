import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatchMile — Matchday mobility copilot",
  description:
    "FIFA World Cup 2026 matchday mobility copilot for Toronto. When to leave, which route has the lowest forecasted crowd risk, and how to get home. Demo replay — no live data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}

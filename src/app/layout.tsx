import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Clash — Ludo King, Monopoly, Snakes",
  description: "4-player Ludo in the browser. Share a room on WhatsApp — no download. Campus board games hub.",
  applicationName: "Campus Clash",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0D1020",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

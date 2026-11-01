import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Campus Clash — Play. Challenge. Represent.", description:"Quick games, friendly rivalries, and campus pride. Play anywhere.", applicationName:"Campus Clash" };
export const viewport: Viewport = { themeColor:"#0D1020", width:"device-width", initialScale:1 };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }

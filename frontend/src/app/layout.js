import { Chakra_Petch, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const chakraPetch = Chakra_Petch({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "GridWise — Smart Campus Energy Optimization Engine",
  description: "BUP CSE Fest 2026 Hackathon · LLM-assisted 24-hour campus energy scheduling, storage management, and operator directive interpretation",
};

import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${chakraPetch.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

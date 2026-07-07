import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const DESC = "An AI-woven dark-fantasy adventure where every choice is remembered — and your bag is never big enough.";
export const metadata: Metadata = {
  title: "Inkling — forge your legend",
  description: DESC,
  openGraph: { title: "Inkling — forge your legend", description: DESC, type: "website" },
  twitter: { card: "summary_large_image", title: "Inkling — forge your legend", description: DESC },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

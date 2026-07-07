import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Inkling — draw yourself into the story",
  description: "An AI picture book where your child's drawings come to life inside the story.",
  openGraph: {
    title: "Inkling — draw yourself into the story",
    description: "An AI picture book where your child's drawings come to life inside the story.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkling — draw yourself into the story",
    description: "An AI picture book where your child's drawings come to life inside the story.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SupportFlow — by SequenceFlow",
  description: "SupportFlow is an AI-powered customer support platform by SequenceFlow. Automatically read, classify, and draft replies to customer emails — so your team can focus on what matters.",
  metadataBase: new URL("https://supportflow.sequenceflow.io"),
  openGraph: {
    title: "SupportFlow — by SequenceFlow",
    description: "AI-powered customer support automation. SupportFlow reads your inbox, understands customer intent, and drafts replies — all in your tone.",
    url: "https://supportflow.sequenceflow.io",
    siteName: "SupportFlow",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

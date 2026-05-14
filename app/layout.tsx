import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZOO",
  description: "Your private AI social universe.",

  openGraph: {
    title: "ZOO",
    description: "Your private AI social universe.",
    url: "https://zoo-brown.vercel.app",
    siteName: "ZOO",
    images: [
      {
        url: "/zoo-og.png",
        width: 1200,
        height: 630,
        alt: "ZOO",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ZOO",
    description: "Your private AI social universe.",
    images: ["/zoo-og.png"],
  },

  icons: {
    icon: "/favicon.ico",
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
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-[#09090f] text-white">
        {children}
      </body>
    </html>
  );
}

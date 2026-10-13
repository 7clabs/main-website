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
  metadataBase: new URL("https://7clabs.com"),
  title: "7C Labs | Secure, observable AI and cloud delivery",
  description:
    "7C Labs builds the platform for the whole software lifecycle: secure-by-default delivery, SRE-grade resilience, and clear monitoring of AI usage across cloud platforms.",
  openGraph: {
    title: "7C Labs | Secure, observable AI and cloud delivery",
    description:
      "From first commit to production: DevSecOps, SRE and AI usage monitoring in one platform.",
    url: "https://7clabs.com",
    siteName: "7C Labs",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

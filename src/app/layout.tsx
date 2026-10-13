import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { AiOpsBackground } from "@/components/AiOpsBackground";
import { ChatWidget } from "@/components/ChatWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Technical, slightly geometric display face for headings.
const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

// Terminal-style mono for labels, logs and status text.
const mono = JetBrains_Mono({
  variable: "--font-mono-jb",
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
      className={`${geistSans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AiOpsBackground />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}

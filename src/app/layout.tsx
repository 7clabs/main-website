import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ChatWidget } from "@/components/ChatWidget";
import { BootLoader } from "@/components/BootLoader";
import { PageTransition } from "@/components/PageTransition";
import { SceneLayer } from "@/components/SceneLayer";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

// One open-licence geometric sans for headings and body (self-hosted by next/font); weights run light to bold.
const sans = Outfit({
  variable: "--font-sans-display",
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
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets the theme before first paint so there is no flash: the saved choice, else the system setting. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        <SceneLayer />
        <BootLoader />
        <PageTransition>{children}</PageTransition>
        <ChatWidget />
      </body>
    </html>
  );
}

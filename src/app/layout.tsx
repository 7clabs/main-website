import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";
import { AiOpsBackground } from "@/components/AiOpsBackground";
import { ChatWidget } from "@/components/ChatWidget";
import "./globals.css";

// One clean grotesque for headings and body; weights run from light to bold.
const geistSans = Hanken_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Editorial serif, used for headlines on the light theme.
const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
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
      className={`${geistSans.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets the theme before first paint so there is no flash: the saved choice, else the system setting. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AiOpsBackground />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}

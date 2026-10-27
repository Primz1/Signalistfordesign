import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Signalist",
  description: "Track real-time stock prices, get personalized alerts and explore detailed company insights",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F1EB" },
    { media: "(prefers-color-scheme: dark)", color: "#141311" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable}`}>
      <body className="font-sans text-base antialiased">
        <ThemeProvider>
          <PostHogProvider>
            {children}
          </PostHogProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

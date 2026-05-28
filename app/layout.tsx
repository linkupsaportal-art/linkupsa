import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { PageTransition } from "@/components/effects/page-transition";

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LinkUp — استلم منتجك الرقمي خلال ثوانٍ",
    template: "%s · LinkUp",
  },
  description:
    "منصة سعودية لتسليم المنتجات الرقمية تلقائياً، مرتبطة بسلة. آمنة، سريعة، ومصممة بمعايير عالمية.",
  keywords: ["تسليم منتجات رقمية", "سلة", "Salla", "حسابات", "Steam Guard", "بطاقات شحن", "LinkUp"],
  authors: [{ name: "LinkUp" }],
  applicationName: "LinkUp",
};

export const viewport: Viewport = {
  themeColor: "#313338",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} ${inter.variable} ${geistMono.variable}`}
    >
      <body className="min-h-svh bg-bg text-fg antialiased font-sans selection:bg-accent selection:text-accent-fg">
        <SmoothScrollProvider>
          <PageTransition>{children}</PageTransition>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}

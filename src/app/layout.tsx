import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OMPN2026 - Olimpiade Online",
  description: "Platform Resmi Olimpiade Matematika dan Pengetahuan Nasional 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans", openSans.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

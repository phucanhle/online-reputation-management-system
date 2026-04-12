import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "ORMS | Cinema Reputation Monitor",
  description: "Advanced Reputation Management System with Google Maps Integration",
  keywords: ["cinema", "reputation", "monitoring", "Google Maps", "reviews"],
  openGraph: {
    title: "ORMS | Cinema Reputation Monitor",
    description: "Advanced Reputation Management System with Google Maps Integration",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      {/*
        Font: We rely on the system SF Pro font stack defined in globals.css and tailwind.config.ts.
        No external font imports needed — Apple devices serve SF Pro natively,
        other systems fall back to Helvetica Neue / Arial.
      */}
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

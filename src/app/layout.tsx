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
      <body className="font-sans antialiased text-primary bg-transparent min-h-screen">
        <div className="glass-ambient-bg" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

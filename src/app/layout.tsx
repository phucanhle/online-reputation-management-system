import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

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
      <body className={`${outfit.variable} font-sans antialiased text-primary bg-transparent min-h-screen`}>
        <div className="glass-ambient-bg" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

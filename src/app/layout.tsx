import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import LiffInitializerAndLogger from '@/components/liff/LiffInitializerAndLogger';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 1. ข้อมูลพื้นฐานของหน้าเว็บ
  title: {
    default: "Egg Digital AR Play", // ชื่อเริ่มต้นของหน้า
    template: "%s | Egg Digital", // template สำหรับหน้าอื่น ๆ ที่ปรับเปลี่ยน title ได้
  },
  keywords: ["Next.js", "PWA", "React", "SEO", "Web App"],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <LiffInitializerAndLogger />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover'};

export const metadata: Metadata = {
  title: "此生 · 随机人生模拟",
  description: "如果重来，你会是谁？随机出生、家庭处境与跨年的选择后果，陪你从人生起点走到最后一张总结卡片。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans">
      <body className="antialiased">{children}</body>
    </html>
  );
}

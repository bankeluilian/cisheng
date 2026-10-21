import type { Metadata, Viewport } from "next";
import "./globals.css";
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover'};

export const metadata: Metadata = {
  title: "此生 · 每一次出生，都是一个世界",
  description: "一次随机的出生，一段由你选择的人生。体验成长、相遇与告别，留下一张属于此生的卡片。",
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

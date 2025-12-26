import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PushEngage AI - Generate Push Notifications",
  description: "AI-powered push notification content generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


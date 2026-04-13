import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SALENLO | Sales & lead management",
  description: "SALENLO — sales pipeline and lead management for your team.",
  applicationName: "SALENLO",
  icons: {
    icon: "/brand-mark.png",
    apple: "/brand-mark.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-white antialiased text-neutral-900">{children}</body>
    </html>
  );
}

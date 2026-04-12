import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead CRM | Sales & Lead Management",
  description: "Lead and sales pipeline CRM",
  icons: {
    icon: "/brand-mark.png",
    apple: "/brand-mark.png",
  },
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Git Interview",
  description: "Browser-based coding interview platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-mono antialiased">
        {children}
      </body>
    </html>
  );
}

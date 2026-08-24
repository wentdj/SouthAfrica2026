import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "South Africa 2026 | Safari Journal",
  description: "A private safari itinerary for South Africa, September–October 2026.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

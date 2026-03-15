import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rex Hotel Management",
  description: "Rex Hotel Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

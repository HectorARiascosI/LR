import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Para Leyre",
  description: "Un mes. Un universo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>
    </html>
  );
}

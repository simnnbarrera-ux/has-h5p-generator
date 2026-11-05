import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HAS H5P Generator — Recursos educativos UAO",
  description:
    "Plataforma institucional de co-creación inteligente de paquetes interactivos H5P para el Campus Digital UAO (Digitatón 2026 - Reto 11).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#8A1428",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased selection:bg-rose-100">{children}</body>
    </html>
  );
}

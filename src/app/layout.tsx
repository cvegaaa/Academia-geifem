import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppStoreProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "GEIFEM Academy — Cursos online con certificado",
  description:
    "Cursos online prácticos de ofimática y habilidades laborales, con certificado digital verificable. Aprende Excel, Word y más a tu ritmo, sin importar tu experiencia previa.",
  icons: { icon: "/brand/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased`}>
        <AppStoreProvider>{children}</AppStoreProvider>
      </body>
    </html>
  );
}

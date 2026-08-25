import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppStoreProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Academia",
  description: "Cursos cortos y prácticos de ofimática y habilidades laborales.",
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

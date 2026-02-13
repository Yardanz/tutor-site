import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MobileTelegramButton } from "@/components/site/MobileTelegramButton";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  display: "swap",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Екатерина Драндина | Английский онлайн для школьников и подростков",
  description: "Подготовка к ОГЭ/ЕГЭ и уверенный прогресс в школе — по понятной системе и без перегруза.",
  metadataBase: new URL("https://example.ru"),
  openGraph: {
    title: "Екатерина Драндина | Репетитор по английскому",
    description: "Онлайн-занятия для детей и подростков, подготовка к ОГЭ/ЕГЭ и публичные материалы.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} antialiased`}>
        <div className="min-h-screen bg-gradient-to-b from-[#f8fbff] via-[#f6f8fa] to-[#edf2f7]">
          <Header />
          {children}
          <Footer />
          <MobileTelegramButton />
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { SiteHeader } from "@/components/ui/site-header";
import "./globals.css";

// Public Sans is the typeface of the U.S. Web Design System: the voice of
// American public forms, which is the paperwork MediPlan untangles.
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediPlan",
  description: "Compare employer health plans for your family, for a normal year and a bad one.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${publicSans.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

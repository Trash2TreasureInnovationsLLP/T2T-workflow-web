import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trash2Treasure Innovations LLP | Operations & Agile Dashboard",
  description:
    "Production-grade internal company operations, project management, and Agile work tracking platform for T2T.",
  icons: {
    icon: "/t2t-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F7FDF8] text-slate-900 min-h-screen selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}

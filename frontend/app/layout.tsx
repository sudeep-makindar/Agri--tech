import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AgriAI Nexus — Smart Agriculture Platform",
  description: "AI-powered agricultural intelligence: crop analytics, disease detection, market forecasting & soil analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen" style={{ background: '#040810' }}>
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto h-[calc(100vh-60px)]" style={{ background: '#040810' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

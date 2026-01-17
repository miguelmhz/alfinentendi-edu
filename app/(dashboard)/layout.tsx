import type { Metadata } from "next";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar/sidebar";
import { AppSidebar } from "@/components/shared/dashboard-sidebar";
import { SidebarInset } from "@/components/ui/sidebar/sidebar";
import { Toaster } from "@/components/ui/sonner"

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Dashboard | Al Fin Entendí",
  description: "Panel de administración - Plataforma educativa Al Fin Entendí",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider 
      className="flex flex-col h-screen"
      style={{
        "--sidebar-width": "331px",
      } as React.CSSProperties}
    >
      <DashboardHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <SidebarInset>
          {children}
          <Toaster />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

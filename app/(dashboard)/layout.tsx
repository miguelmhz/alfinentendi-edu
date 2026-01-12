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
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider 
      className="flex flex-col"
      style={{
        "--sidebar-width": "331px",
      } as React.CSSProperties}
    >
      <DashboardHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <SidebarInset>
          <div className="flex-1 w-full flex flex-col gap-20 items-center">
            {children}
          </div>
          <Toaster />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

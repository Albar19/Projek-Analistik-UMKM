"use client";

import { Sidebar } from "@/components/Sidebar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 lg:ml-0 overflow-auto flex flex-col">
        {/* Header with NotificationCenter */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center justify-between lg:justify-end">
          <h2 className="lg:hidden text-lg font-semibold text-slate-900">Analistik UMKM</h2>
          <div className="flex items-center gap-4">
            <NotificationCenter />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

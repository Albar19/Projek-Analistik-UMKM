"use client";

import { Sidebar } from "@/components/Sidebar";
import { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 lg:ml-0 overflow-auto">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

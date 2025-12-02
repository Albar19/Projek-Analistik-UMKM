"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <User className="w-4 h-4" />
        Masuk
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {session.user?.name?.charAt(0) || "U"}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 hidden sm:block">
          {session.user?.name?.split(" ")[0]}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-800">{session.user?.name}</p>
            <p className="text-xs text-slate-500">{session.user?.email}</p>
          </div>
          
          <div className="py-2">
            <Link
              href="/pengaturan"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Pengaturan
            </Link>
          </div>
          
          <div className="border-t border-slate-100 pt-2">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentUser = useStore((state) => state.currentUser);
  const currentUserId = useStore((state) => state.currentUserId);

  // Cache user data to prevent flickering
  const [cachedUser, setCachedUser] = useState<{
    name: string;
    email: string;
    image?: string;
  } | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update cached user when session or store changes
  useEffect(() => {
    if (session?.user) {
      setCachedUser({
        name: session.user.name || 'User',
        email: session.user.email || '',
        image: session.user.image || undefined,
      });
    } else if (currentUser) {
      setCachedUser({
        name: currentUser.name || 'User',
        email: currentUser.email || '',
        image: currentUser.image || undefined,
      });
    }
    
    // Clear cache on logout
    if (status === 'unauthenticated') {
      setCachedUser(null);
    }
  }, [session, currentUser, status]);

  // Use cached user for stable display
  const displayUser = cachedUser || session?.user || currentUser;
  const isAuthenticated = cachedUser !== null || status === 'authenticated' || currentUserId;
  const isFirstLoad = status === "loading" && !cachedUser && !currentUser;

  // Only show loading skeleton on first load
  if (isFirstLoad) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated || !displayUser) {
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
        {displayUser.image ? (
          <img
            src={displayUser.image}
            alt={displayUser.name || "User"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {displayUser.name?.charAt(0) || "U"}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 hidden sm:block">
          {displayUser.name?.split(" ")[0]}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-800">{displayUser.name}</p>
            <p className="text-xs text-slate-500">{displayUser.email}</p>
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

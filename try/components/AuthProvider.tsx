"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useStore } from "@/lib/store";

interface AuthProviderProps {
  children: ReactNode;
}

// Component to sync session with store
function SessionSync({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { initializeUserData, clearUserData, currentUserId } = useStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userId = session.user.id || session.user.email || "";
      const userName = session.user.name || "User";
      const userEmail = session.user.email || "";
      const userImage = session.user.image || undefined;

      // Only initialize if user changed or not initialized
      if (currentUserId !== userId) {
        initializeUserData(userId, userName, userEmail, userImage);
      }
    } else if (status === "unauthenticated") {
      clearUserData();
    }
  }, [session, status, initializeUserData, clearUserData, currentUserId]);

  return <>{children}</>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <SessionSync>{children}</SessionSync>
    </SessionProvider>
  );
}

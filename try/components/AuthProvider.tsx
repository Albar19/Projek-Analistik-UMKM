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
  const { loadDataFromMySQL, clearUserData, currentUserId } = useStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Use email as unique identifier for each Google account
      const userId = session.user.email || session.user.id || "";
      const userName = session.user.name || "User";
      const userEmail = session.user.email || "";
      const userImage = session.user.image || undefined;

      // Only initialize if user changed or not initialized
      if (currentUserId !== userId) {
        // Load data from MySQL database (will fallback to localStorage if MySQL fails)
        const user = {
          id: userId,
          name: userName,
          email: userEmail,
          image: userImage,
          role: 'admin' as const,
          createdAt: new Date(),
        };
        console.log('🔄 Loading data for user:', userEmail);
        loadDataFromMySQL(userId, user);
      }
    } else if (status === "unauthenticated") {
      clearUserData();
    }
  }, [session, status, loadDataFromMySQL, clearUserData, currentUserId]);

  return <>{children}</>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <SessionSync>{children}</SessionSync>
    </SessionProvider>
  );
}

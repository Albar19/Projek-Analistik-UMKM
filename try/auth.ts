import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { query } from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";

// Log untuk debugging
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.log("⚠️  Google OAuth tidak dikonfigurasi");
} else {
  console.log("✅ Google OAuth siap digunakan");
}

const config = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists in database
          const userResult = await query(
            'SELECT id FROM users WHERE email = ?',
            [user.email!]
          );

          if (!Array.isArray(userResult) || userResult.length === 0) {
            // Create new user
            try {
              const userId = uuidv4();
              await query(
                'INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)',
                [userId, user.email, user.name, user.image]
              );

              // Create default business settings
              const settingsId = uuidv4();
              await query(
                'INSERT INTO business_settings (id, userId, storeName, timezone, currency) VALUES (?, ?, ?, ?, ?)',
                [settingsId, userId, 'Toko Saya', 'Asia/Jakarta', 'IDR']
              );

              console.log("✅ New user created:", user.email);
            } catch (error) {
              console.error("⚠️ Failed to create user in database:", (error as Error).message);
              // Don't block login if database fails
            }
          }
        } catch (error) {
          console.error("Error during sign in:", error);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(config);

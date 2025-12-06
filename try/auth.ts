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

              // Create default settings in 'settings' table (not business_settings)
              const settingsId = uuidv4();
              await query(
                `INSERT INTO settings (
                  id, userId, businessName, storeAddress, businessType, 
                  currency, timezone, lowStockThreshold, enableNotifications,
                  enableAutoReports, reportFrequency, categories, units
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  settingsId, 
                  userId, 
                  `Toko ${user.name}`,  // businessName
                  '',                    // storeAddress
                  'retail',              // businessType
                  'IDR',                 // currency
                  'Asia/Jakarta',        // timezone
                  10,                    // lowStockThreshold
                  1,                     // enableNotifications
                  0,                     // enableAutoReports
                  'weekly',              // reportFrequency
                  JSON.stringify(['Makanan', 'Minuman', 'Snack', 'Lainnya']),  // categories
                  JSON.stringify(['Pcs', 'Box', 'Kg', 'Liter'])                 // units
                ]
              );

              console.log("✅ New user created:", user.email, "with userId:", userId);
            } catch (error) {
              console.error("⚠️ Failed to create user in database:", (error as Error).message);
              // Don't block login if database fails
            }
          } else {
            console.log("✅ Existing user logged in:", user.email, "userId:", (userResult[0] as any).id);
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

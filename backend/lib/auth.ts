import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/backend/config/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: {
              email: (credentials.email as string).toLowerCase(),
            },
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Return user object (exclude password)
          return {
            id: String(user.id),
            email: user.email,
            name: user.name || "",
          };
        } catch (error: unknown) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = String(user.id);
        token.email = user.email;
        token.name = user.name;
      }
      
      // Update token when session.update() is called from profile page
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        return {
          ...session,
          user: {
            id: token.id as string,
            email: token.email as string,
            name: token.name as string,
          },
        };
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
});

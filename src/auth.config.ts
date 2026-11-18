import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 jam sesuai ketentuan PRD
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword ?? false;
        token.participantCode = user.participantCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId as string) ?? session.user.id;
        session.user.role = (token.role as Role) ?? "PARTICIPANT";
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        session.user.participantCode = (token.participantCode as string) ?? null;
      }
      return session;
    },
  },
  providers: [], // Diisi di auth.ts
};

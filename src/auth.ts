import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        expectedRole: { label: "Expected Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);
        const expectedRole = credentials.expectedRole ? String(credentials.expectedRole) : undefined;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("Akun Anda telah dinonaktifkan oleh administrator.");
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const diffMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
          throw new Error(
            `Akun terkunci sementara karena 5 kali percobaan gagal. Coba lagi dalam ${diffMinutes} menit.`
          );
        }

        // Jika login melalui portal admin, tolak akun peserta dengan pesan umum
        if (expectedRole === "ADMIN" && user.role !== "ADMIN") {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
          const newFailed = user.failedLogins + 1;
          const lockedUntil = newFailed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLogins: newFailed,
              lockedUntil,
            },
          });

          if (newFailed >= 5) {
            throw new Error(
              "Akun terkunci sementara selama 15 menit karena telah mencapai 5 kali percobaan gagal."
            );
          }

          return null;
        }

        // Reset kegagalan login saat berhasil masuk
        if (user.failedLogins > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLogins: 0,
              lockedUntil: null,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          participantCode: user.participantCode,
        };
      },
    }),
  ],
});

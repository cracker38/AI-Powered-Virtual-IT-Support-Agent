import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Corporate AD",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@cypadi.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const { PrismaClient } = await import("@prisma/client");
        const bcrypt = await import("bcryptjs");
        const prisma = new PrismaClient();

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) return null;

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;

          // Log the access
          const ip = req?.headers ? (req.headers as any)["x-forwarded-for"] || "127.0.0.1" : "127.0.0.1";
          const ua = req?.headers ? (req.headers as any)["user-agent"] : "Unknown";

          await (prisma as any).accessLog.create({
            data: {
              userId: user.id,
              ipAddress: typeof ip === "string" ? ip.split(",")[0] : "127.0.0.1",
              userAgent: ua,
              action: "LOGIN"
            }
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        } finally {
          await prisma.$disconnect();
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

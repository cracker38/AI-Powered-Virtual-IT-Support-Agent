import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = async (req: any, context: any) => {
  // Await params if it's a promise (Next.js 15+ requirement)
  if (context.params instanceof Promise) {
    context.params = await context.params;
  }
  return NextAuth(authOptions)(req, context);
};

export { handler as GET, handler as POST };

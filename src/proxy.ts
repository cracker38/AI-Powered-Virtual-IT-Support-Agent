import { withAuth } from "next-auth/middleware";

const authMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      // If accessing admin routes, check if user is ADMIN
      if (req.nextUrl.pathname.startsWith("/admin")) {
        return token?.role === "ADMIN";
      }
      // For other protected routes (like /technician), just require being logged in
      return !!token;
    },
  },
});

export default authMiddleware;
export const proxy = authMiddleware;

// Define which routes should require authentication
export const config = {
  matcher: [
    "/admin/:path*", 
    "/technician/:path*",
  ],
};

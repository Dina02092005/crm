import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const path = req.nextUrl.pathname;
        if (path === "/") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        "/",
        "/dashboard/:path*",
        "/customers/:path*",
        "/employees/:path*",
        "/leads/:path*",
        "/settings/:path*",
        "/roles/:path*",
    ],
};

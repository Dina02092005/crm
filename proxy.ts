import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ token }) => !!token,
    },
    pages: {
        signIn: "/login",
    },
});

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

import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            firstName?: string
            lastName?: string
            role?: string
        } & DefaultSession["user"]
        accessToken?: string
        refreshToken?: string
    }

    interface User {
        id: string
        firstName?: string
        lastName?: string
        role?: string
        accessToken?: string
        refreshToken?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId?: string
        role?: string
        accessToken?: string
        refreshToken?: string
    }
}

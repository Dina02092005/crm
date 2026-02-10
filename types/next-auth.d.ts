import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            firstName?: string
            lastName?: string
            role?: string
            imageUrl?: string | null
        } & DefaultSession["user"]
        accessToken?: string
        refreshToken?: string
    }

    interface User {
        id: string
        firstName?: string
        lastName?: string
        role?: string
        imageUrl?: string | null
        accessToken?: string
        refreshToken?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId?: string
        role?: string
        imageUrl?: string | null
        accessToken?: string
        refreshToken?: string
    }
}

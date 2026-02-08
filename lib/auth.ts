import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password required');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.passwordHash) {
                    throw new Error('Account not found');
                }

                if (!user.isActive) {
                    throw new Error('Account is inactive. Please contact support.');
                }

                if (!user.emailVerified) {
                    throw new Error('Please verify your email via OTP before logging in.');
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                if (!isValid) {
                    throw new Error('Invalid password');
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],

    pages: {
        signIn: '/login',
        newUser: '/register',
        error: '/login',
    },

    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                if (!user.email) return false;

                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    });

                    if (existingUser) {
                        return true;
                    }

                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || 'Unknown',
                            // Default role, adjust as needed
                            role: 'EMPLOYEE',
                            isActive: true,
                            emailVerified: new Date(),
                            // No password hash for Google users
                        },
                    });
                    return true;
                } catch (error) {
                    console.error('Error in Google signIn callback:', error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                });
                if (dbUser) {
                    token.userId = dbUser.id;
                    token.role = dbUser.role;
                }
            }
            return token;
        },

        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.userId as string,
                    role: token.role as string,
                },
            };
        },
    },

    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 1 day
    },

    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};


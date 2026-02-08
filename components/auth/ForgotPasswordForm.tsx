"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

export function ForgotPasswordForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        try {
            await axios.post("/api/auth/forgot-password", { email });
            toast.success("If an account exists, an OTP has been sent.");
            router.push(`/new-password?email=${encodeURIComponent(email)}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send reset code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm sm:max-w-md rounded-3xl border-0 bg-white shadow-2xl">
            <CardHeader className="pb-4 pt-6 px-6 sm:pt-8 sm:px-8">
                <CardTitle className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    Forgot Password
                </CardTitle>
                <p className="text-center text-sm text-gray-600 mt-2">
                    Enter your email address and we&apos;ll send you a code to reset your password
                </p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-6 sm:px-8 pb-6 sm:pb-8">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label
                            htmlFor="forgot-email"
                            className="text-sm font-medium text-gray-700"
                        >
                            Email
                        </Label>
                        <Input
                            id="forgot-email"
                            type="email"
                            placeholder="example@email.com"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 rounded-lg border-gray-300 bg-gray-50 transition-colors placeholder:text-gray-400 hover:border-gray-400 focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:bg-white"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg bg-cyan-600 text-base font-semibold text-white shadow-md transition-all hover:bg-cyan-700 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                    >
                        {isLoading ? "Sending..." : "Send Reset Code"}
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-600 pt-2">
                    Remember your password?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 rounded"
                    >
                        Back to Login
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}

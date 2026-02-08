"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";

function OTPVerificationFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    useEffect(() => {
        if (!email) {
            toast.error("Invalid verification session");
            router.push("/register");
        }
    }, [email, router]);

    const handleChange = (index: number, value: string) => {
        if (value.length <= 1 && /^\d*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value && index < 5) {
                const nextInput = document.getElementById(`otp-${index + 1}`);
                nextInput?.focus();
            } else if (value && index === 5) {
                // Auto-submit when the last digit is entered
                const fullOtp = newOtp.join("");
                if (fullOtp.length === 6) {
                    setTimeout(() => {
                        handleVerify(null as any, fullOtp);
                    }, 100);
                }
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleVerify = async (e?: React.FormEvent, overrideCode?: string) => {
        if (e) e.preventDefault();
        const code = overrideCode || otp.join("");
        if (code.length !== 6) {
            toast.error("Please enter 6-digit code");
            return;
        }

        setIsLoading(true);
        try {
            await axios.post("/api/auth/verify", { email, otp: code });
            toast.success("Email verified successfully!");
            router.push("/login?verified=true");
        } catch (error: any) {
            const message = error.response?.data?.message || "Verification failed. Please check the code and try again.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await axios.post("/api/auth/forgot-password", { email });
            toast.success("New code sent!");
        } catch (error) {
            toast.error("Failed to resend code");
        }
    };

    return (
        <Card className="w-full max-w-sm sm:max-w-md rounded-3xl border-0 bg-white shadow-2xl">
            <CardHeader className="pb-4 pt-6 px-6 sm:pt-8 sm:px-8">
                <CardTitle className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    Verify Email
                </CardTitle>
                <p className="text-center text-sm text-gray-600 mt-2">
                    Enter the 6-digit code sent to <strong>{email}</strong>
                </p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-6 sm:px-8 pb-6 sm:pb-8">
                <form className="space-y-5" onSubmit={handleVerify}>
                    <div className="flex gap-2 justify-center">
                        {otp.map((digit, index) => (
                            <Input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="h-12 w-12 sm:h-14 sm:w-14 text-center text-xl font-semibold rounded-lg border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 focus-visible:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500/20 focus-visible:bg-white"
                            />
                        ))}
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg bg-green-600 text-base font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                    >
                        {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>
                </form>

                <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                        Didn&apos;t receive the code?{" "}
                        <button
                            type="button"
                            onClick={handleResend}
                            className="font-semibold text-green-600 hover:text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 rounded"
                        >
                            Resend Code
                        </button>
                    </p>
                    <p className="text-sm text-gray-600">
                        <Link
                            href="/login"
                            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
                        >
                            Back to Login
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export function OTPVerificationForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OTPVerificationFormContent />
        </Suspense>
    )
}

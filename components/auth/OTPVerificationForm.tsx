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
    const loginType = (searchParams.get("role") || "student") as "student" | "admin" | "agent" | "counselor";
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    // Role-specific accents
    const accents: Record<string, any> = {
        admin: { text: "text-indigo-600", eyebrow: "Admin Portal", borderHover: "hover:border-indigo-400", focusBorder: "focus-visible:border-indigo-500", ring: "focus-visible:ring-indigo-500/5", bg: "bg-indigo-600", shadow: "shadow-indigo-600/20", groupFocus: "group-focus-within:text-indigo-600" },
        student: { text: "text-teal-600", eyebrow: "Student Portal", borderHover: "hover:border-teal-400", focusBorder: "focus-visible:border-teal-500", ring: "focus-visible:ring-teal-500/5", bg: "bg-gradient-to-r from-teal-600 to-[#1EB3B1]", shadow: "shadow-teal-600/20", groupFocus: "group-focus-within:text-teal-600" },
        agent: { text: "text-blue-600", eyebrow: "Agent Portal", borderHover: "hover:border-blue-400", focusBorder: "focus-visible:border-blue-500", ring: "focus-visible:ring-blue-500/5", bg: "bg-blue-600", shadow: "shadow-blue-600/20", groupFocus: "group-focus-within:text-blue-600" },
        counselor: { text: "text-purple-600", eyebrow: "Counselor Portal", borderHover: "hover:border-purple-400", focusBorder: "focus-visible:border-purple-500", ring: "focus-visible:ring-purple-500/5", bg: "bg-purple-600", shadow: "shadow-purple-600/20", groupFocus: "group-focus-within:text-purple-600" },
    };

    const clr = accents[loginType] || accents.student;

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
            router.push(`/login?verified=true&type=${loginType}`);
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
        <div className="w-full">
            <div className="mb-10">
                <div className={`text-[10px] uppercase tracking-[0.2em] ${clr.text} font-bold mb-2 transition-colors`}>
                    {clr.eyebrow}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                    Verify Email
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    Enter the 6-digit code sent to <strong>{email}</strong> to verify your account.
                </p>
            </div>

            <div className="space-y-8">
                <form className="space-y-6" onSubmit={handleVerify}>
                    <div className="flex gap-2 sm:gap-3 justify-between">
                        {otp.map((digit, index) => (
                            <div key={index} className="relative group">
                                <Input
                                    id={`otp-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className={`h-12 w-10 sm:h-14 sm:w-14 text-center text-xl font-bold rounded-xl border-gray-200 bg-white text-gray-900 transition-all ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                                />
                            </div>
                        ))}
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className={`h-12 w-full rounded-xl ${clr.bg} text-sm font-bold text-white shadow-lg ${clr.shadow} transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50`}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Verifying...</span>
                            </div>
                        ) : "Verify Code"}
                    </Button>
                </form>

                <div className="text-center space-y-4 pt-2">
                    <p className="text-sm text-gray-500 font-medium">
                        Didn&apos;t receive the code?{" "}
                        <button
                            type="button"
                            onClick={handleResend}
                            className={`${clr.text} font-bold hover:underline ml-1 transition-colors`}
                        >
                            Resend Code
                        </button>
                    </p>
                    <div className="pt-2 border-t border-gray-100">
                        <Link href={`/login?type=${loginType}`} className="text-sm text-gray-400 font-bold hover:text-gray-600 transition-colors">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function OTPVerificationForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OTPVerificationFormContent />
        </Suspense>
    )
}

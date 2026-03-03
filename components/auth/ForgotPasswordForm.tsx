"use client";

import { useState, Suspense } from "react";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

function ForgotPasswordFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const loginType = (searchParams.get("type") || "student") as "student" | "admin" | "agent" | "counselor";
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");

    // Role-specific accents
    const accents: Record<string, any> = {
        admin: { text: "text-indigo-600", eyebrow: "Admin Portal", borderHover: "hover:border-indigo-400", focusBorder: "focus-visible:border-indigo-500", ring: "focus-visible:ring-indigo-500/5", bg: "bg-indigo-600", shadow: "shadow-indigo-600/20", groupFocus: "group-focus-within:text-indigo-600" },
        student: { text: "text-teal-600", eyebrow: "Student Portal", borderHover: "hover:border-teal-400", focusBorder: "focus-visible:border-teal-500", ring: "focus-visible:ring-teal-500/5", bg: "bg-gradient-to-r from-teal-600 to-[#1EB3B1]", shadow: "shadow-teal-600/20", groupFocus: "group-focus-within:text-teal-600" },
        agent: { text: "text-blue-600", eyebrow: "Agent Portal", borderHover: "hover:border-blue-400", focusBorder: "focus-visible:border-blue-500", ring: "focus-visible:ring-blue-500/5", bg: "bg-blue-600", shadow: "shadow-blue-600/20", groupFocus: "group-focus-within:text-blue-600" },
        counselor: { text: "text-purple-600", eyebrow: "Counselor Portal", borderHover: "hover:border-purple-400", focusBorder: "focus-visible:border-purple-500", ring: "focus-visible:ring-purple-500/5", bg: "bg-purple-600", shadow: "shadow-purple-600/20", groupFocus: "group-focus-within:text-purple-600" },
    };

    const clr = accents[loginType] || accents.student;

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
            router.push(`/new-password?email=${encodeURIComponent(email)}&type=${loginType}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send reset code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-10">
                <div className={`text-[10px] uppercase tracking-[0.2em] ${clr.text} font-bold mb-2`}>
                    {clr.eyebrow}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                    Forgot Password
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    Enter your email address and we&apos;ll send you a code to reset your password.
                </p>
            </div>

            <div className="space-y-6">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="forgot-email" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                                Email Address
                            </Label>
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors`}>
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="example@email.com"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`h-12 pl-11 rounded-xl border-gray-200 bg-white text-gray-900 transition-all placeholder:text-gray-400 ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className={`h-12 w-full rounded-xl ${clr.bg} text-sm font-bold text-white shadow-lg ${clr.shadow} transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50`}
                    >
                        {isLoading ? "Sending..." : "Send Reset Code"}
                    </Button>
                </form>

                <div className="text-center text-sm text-gray-500 font-medium pt-4">
                    Remember your password?{" "}
                    <Link href={`/login?type=${loginType}`} className={`${clr.text} font-bold hover:underline`}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function ForgotPasswordForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordFormContent />
        </Suspense>
    );
}

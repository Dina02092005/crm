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
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "sonner";
import axios from "axios";

function NewPasswordFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        otp: "",
        password: "",
        confirmPassword: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            await axios.post("/api/auth/reset-password", {
                email,
                otp: formData.otp,
                newPassword: formData.password
            });
            toast.success("Password reset successful!");
            router.push("/login?reset=success");
        } catch (error: any) {
            const message = error.response?.data?.message || "Reset failed. Please check the OTP and try again.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm sm:max-w-md rounded-3xl border-0 bg-white shadow-2xl">
            <CardHeader className="pb-4 pt-6 px-6 sm:pt-8 sm:px-8">
                <CardTitle className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    Set New Password
                </CardTitle>
                <p className="text-center text-sm text-gray-600 mt-2">
                    Enter the code sent to your email and your new password
                </p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-6 sm:px-8 pb-6 sm:pb-8">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="reset-otp">6-Digit OTP</Label>
                        <Input
                            id="reset-otp"
                            type="text"
                            required
                            maxLength={6}
                            value={formData.otp}
                            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                            className="h-11 rounded-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <PasswordInput
                            id="new-password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="h-11 rounded-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <PasswordInput
                            id="confirm-password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="h-11 rounded-lg"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg bg-cyan-600 text-base font-semibold text-white shadow-md transition-all hover:bg-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-600 pt-2">
                    <Link href="/login" className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline">
                        Back to Login
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}

export function NewPasswordForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewPasswordFormContent />
        </Suspense>
    )
}

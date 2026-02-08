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

export function RegisterForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post("/api/auth/register", formData);
            toast.success(response.data.message);
            // Pass email to verification page via search params
            router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        } catch (error: any) {
            const message = error.response?.data?.message || "Registration failed. Please try again.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm sm:max-w-md rounded-3xl border-0 bg-white shadow-2xl">
            <CardHeader className="pb-4 pt-6 px-6 sm:pt-8 sm:px-8">
                <CardTitle className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    Create Account
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-6 sm:px-8 pb-6 sm:pb-8">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="reg-name">Full Name</Label>
                        <Input
                            id="reg-name"
                            type="text"
                            placeholder="John Doe"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="h-11 rounded-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <Input
                            id="reg-email"
                            type="email"
                            placeholder="example@email.com"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="h-11 rounded-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input
                            id="reg-password"
                            type="password"
                            placeholder="At least 8 characters"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="h-11 rounded-lg"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg bg-green-600 text-base font-semibold text-white shadow-md hover:bg-green-700 transition-all"
                    >
                        {isLoading ? "Creating account..." : "Register"}
                    </Button>
                </form>

                <div className="text-center text-sm text-gray-600 mt-4">
                    Already have an account?{" "}
                    <Link href="/login" className="text-green-600 font-medium hover:underline">
                        Login
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

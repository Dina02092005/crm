"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
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
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import { toast } from "sonner";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "Callback") {
        const errorMsg = "Login failed. You may not be authorized.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else if (errorParam === "OAuthAccountNotLinked") {
        const errorMsg = "To confirm your identity, sign in with the same account you used originally.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else if (errorParam === "AccessDenied") {
        const errorMsg = "You are not authorized to access this application. Please contact the administrator.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        setError(errorParam);
        toast.error(errorParam);
      }
    }

    if (searchParams.get("verified")) {
      toast.success("Email verified! You can now login.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Basic client-side validation
      if (!formData.email.includes("@")) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth wraps our thrown errors from lib/auth.ts in result.error
        const errorMessage = result.error === "CredentialsSignin"
          ? "Invalid email or password"
          : result.error;
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        if (result?.ok) {
          toast.success("Login successful!");
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (error) {
      setError("An unexpected error occurred during login.");
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm sm:max-w-md rounded-3xl border-0 bg-white dark:bg-card shadow-2xl dark:shadow-none dark:border dark:border-border">
      <CardHeader className="pb-4 pt-6 px-6 sm:pt-8 sm:px-8">
        <CardTitle className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">
          CRM Login
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5 px-6 sm:px-8 pb-6 sm:pb-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label
              htmlFor="login-email"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder="example@email.com"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-11 rounded-lg border-gray-300 bg-gray-50 transition-colors placeholder:text-gray-400 hover:border-gray-400 focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:bg-white dark:bg-secondary/50 dark:border-border dark:text-foreground dark:focus-visible:bg-secondary"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="login-password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 rounded"
              >
                Forgot Password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-11 rounded-lg border-gray-300 bg-gray-50 transition-colors placeholder:text-gray-400 hover:border-gray-400 focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:bg-white dark:bg-secondary/50 dark:border-border dark:text-foreground dark:focus-visible:bg-secondary"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-lg bg-cyan-600 text-base font-semibold text-white shadow-md transition-all hover:bg-cyan-700 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link href="/register" className="text-cyan-600 font-medium hover:underline">
            Register
          </Link>
        </div>

        <div className="relative py-3">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-sm text-gray-500 dark:bg-card dark:text-gray-400">Or</span>
          </div>
        </div>

        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-lg border-gray-300 bg-white text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm dark:bg-card dark:text-foreground dark:border-border dark:hover:bg-secondary/50"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <FaGoogle className="h-5 w-5 shrink-0 mr-2" />
            Sign in with Google
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  )
}


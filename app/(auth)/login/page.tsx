import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const callbackUrl = typeof resolvedParams?.callbackUrl === 'string' ? resolvedParams.callbackUrl : "";
  const typeParam = typeof resolvedParams?.type === 'string' ? resolvedParams.type : "";

  let loginType: "student" | "admin" | "agent" | "counselor" = "student";

  if (typeParam === "admin" || callbackUrl.includes("/admin")) {
    loginType = "admin";
  } else if (typeParam === "agent" || callbackUrl.includes("/agent")) {
    loginType = "agent";
  } else if (typeParam === "counselor" || callbackUrl.includes("/counselor") || callbackUrl.includes("/couselor")) {
    loginType = "counselor";
  }

  return (
    <AuthLayout loginType={loginType}>
      <LoginForm loginType={loginType} />
    </AuthLayout>
  );
}

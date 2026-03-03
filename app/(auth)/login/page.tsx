import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const callbackUrl = typeof searchParams?.callbackUrl === 'string' ? searchParams.callbackUrl : "";
  const typeParam = typeof searchParams?.type === 'string' ? searchParams.type : "";

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

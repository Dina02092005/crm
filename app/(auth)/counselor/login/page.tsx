import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function CounselorLoginPage() {
    return (
        <AuthLayout loginType="counselor">
            <LoginForm loginType="counselor" />
        </AuthLayout>
    );
}

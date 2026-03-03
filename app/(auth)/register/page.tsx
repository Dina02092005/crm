"use client";

import { useState } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function RegisterPage() {
    return (
        <AuthLayout loginType="student">
            <RegisterForm fixedRole="student" />
        </AuthLayout>
    );
}

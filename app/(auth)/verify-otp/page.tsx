import { AuthLayout } from "@/components/auth/AuthLayout";
import { OTPVerificationForm } from "@/components/auth/OTPVerificationForm";

export default function VerifyOTPPage() {
    return (
        <AuthLayout>
            <OTPVerificationForm />
        </AuthLayout>
    );
}

import { AuthLayout } from "@/components/auth/AuthLayout";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";

export default function NewPasswordPage() {
    return (
        <AuthLayout>
            <NewPasswordForm />
        </AuthLayout>
    );
}

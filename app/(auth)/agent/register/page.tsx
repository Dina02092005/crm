import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function AgentRegisterPage() {
    return (
        <AuthLayout loginType="agent">
            <RegisterForm fixedRole="agent" />
        </AuthLayout>
    );
}

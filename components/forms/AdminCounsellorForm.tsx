"use client"

import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from "sonner"
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'

const counsellorSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    roleId: z.string().optional().nullable(),
    agentId: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
});

interface AdminCounsellorFormProps {
    onSuccess?: () => void
    formId?: string
}

function ErrorMessage({ field }: { field: any }) {
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null

    return (
        <p className="text-xs text-red-500">
            {field.state.meta.errors
                .map((e: any) => (typeof e === 'object' && e?.message ? e.message : e))
                .join(', ')}
        </p>
    )
}

export default function AdminCounsellorForm({ onSuccess, formId }: AdminCounsellorFormProps) {
    const queryClient = useQueryClient();
    const [availableRoles, setAvailableRoles] = useState<any[]>([]);
    const [availableAgents, setAvailableAgents] = useState<any[]>([]);

    useEffect(() => {
        // Fetch roles
        fetch("/api/roles")
            .then(res => res.json())
            .then(data => setAvailableRoles(data))
            .catch(err => console.error("Failed to fetch roles", err));

        // Fetch agents
        fetch("/api/agents?limit=100")
            .then(res => res.json())
            .then(data => setAvailableAgents(data.employees || data))
            .catch(err => console.error("Failed to fetch agents", err));
    }, []);

    const form = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            roleId: '',
            agentId: '',
            status: 'ACTIVE' as const,
        },
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            // @ts-ignore
            onChange: counsellorSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                const res = await axios.post("/api/admin/counsellors", value);
                toast.success("Counsellor created successfully");
                queryClient.invalidateQueries({ queryKey: ["employees"] });
                queryClient.invalidateQueries({ queryKey: ["counselors"] });
                queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
                onSuccess?.();
            } catch (error: any) {
                console.error("Counsellor creation error:", error);
                const errorMsg = error.response?.data?.error || "Failed to create counsellor";
                toast.error(errorMsg);
            }
        },
    });

    return (
        <form
            id={formId}
            onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
            }}
            className="space-y-4 py-4"
        >
            <div className="grid grid-cols-2 gap-4">
                <form.Field
                    name="firstName"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>First Name</Label>
                            <Input
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter first name"
                            />
                            <ErrorMessage field={field} />
                        </div>
                    )}
                />
                <form.Field
                    name="lastName"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>Last Name</Label>
                            <Input
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter last name"
                            />
                            <ErrorMessage field={field} />
                        </div>
                    )}
                />
            </div>

            <form.Field
                name="email"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>Email</Label>
                        <Input
                            id={field.name}
                            type="email"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="counsellor@example.com"
                        />
                        <ErrorMessage field={field} />
                    </div>
                )}
            />

            <form.Field
                name="phone"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>Phone Number</Label>
                        <PhoneInput
                            value={field.state.value}
                            onChange={(phone) => field.handleChange(phone)}
                        />
                        <ErrorMessage field={field} />
                    </div>
                )}
            />

            <form.Field
                name="password"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>Password</Label>
                        <Input
                            id={field.name}
                            type="password"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="••••••••"
                        />
                        <ErrorMessage field={field} />
                    </div>
                )}
            />

            <form.Field
                name="agentId"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>Assign Agent (Parent)</Label>
                        <select
                            id={field.name}
                            value={field.state.value || ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                        >
                            <option value="">Select Agent (Optional)</option>
                            {availableAgents.map(agent => (
                                <option key={agent.id} value={agent.agentProfile?.id || agent.id}>
                                    {agent.name} {agent.agentProfile?.companyName ? `(${agent.agentProfile.companyName})` : ''}
                                </option>
                            ))}
                        </select>
                        <ErrorMessage field={field} />
                    </div>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <form.Field
                    name="roleId"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>Assign Permissions Role</Label>
                            <select
                                id={field.name}
                                value={field.state.value || ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select Role (Optional)</option>
                                {availableRoles.filter(r => r.isActive).map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                />

                <form.Field
                    name="status"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>Status</Label>
                            <select
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value as any)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    )}
                />
            </div>
        </form>
    );
}

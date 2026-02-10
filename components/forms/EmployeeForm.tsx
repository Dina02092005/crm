"use client"

import { useForm } from '@tanstack/react-form'
import { toast } from "sonner"
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { parseDate } from '@internationalized/date'
import { Label } from '@/components/ui/label'
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/use-employees'
import { Employee } from '@/types/api'
import { PhoneInput } from '@/components/ui/phone-input'

const employeeSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    role: z.enum(["ADMIN", "MANAGER", "SALES_REP", "SUPPORT_AGENT", "EMPLOYEE"]).optional(), // Made optional based on context
    department: z.string().min(2, "Department is required"),
    salary: z.coerce.number().min(0, "Salary must be a positive number"),
    joiningDate: z.string(),
    designation: z.string(),
    imageUrl: z.string().nullable(),
});

interface EmployeeFormProps {
    employee?: Employee
    onSuccess?: () => void
    formId?: string
}

function ErrorMessage({ field }: { field: any }) {
    // Only show error if the field has been touched and has errors
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null

    return (
        <p className="text-sm text-red-500">
            {field.state.meta.errors
                .map((e: any) => (typeof e === 'object' && e?.message ? e.message : e))
                .join(', ')}
        </p>
    )
}

export default function EmployeeForm({ employee, onSuccess, formId }: EmployeeFormProps) {
    const createMutation = useCreateEmployee()
    const updateMutation = useUpdateEmployee()

    const form = useForm({
        defaultValues: {
            phone: employee?.phone || '',
            email: employee?.email || '',
            firstName: employee?.firstName || '',
            lastName: employee?.lastName || '',
            department: employee?.department || '',
            designation: employee?.designation || '',
            joiningDate: employee?.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
            salary: employee?.salary || 0,
            imageUrl: employee?.imageUrl || null,
            password: '',
        },
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            onChange: employeeSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                // Construct the payload matching the API expectation
                const payload: any = {
                    ...value,
                    name: `${value.firstName} ${value.lastName}`.trim(),
                    salary: Number(value.salary),
                    imageUrl: value.imageUrl
                };

                if (payload.password === "") {
                    delete payload.password;
                }

                if (employee && employee.id) {
                    await updateMutation.mutateAsync({ id: employee.id, data: payload })
                    toast.success("Employee updated successfully");
                } else {
                    // For creation, password is required
                    if (!payload.password) {
                        toast.error("Password is required for new employees");
                        return;
                    }
                    // @ts-ignore
                    await createMutation.mutateAsync(payload)
                    toast.success("Employee created successfully");
                }
                onSuccess?.()
            } catch (error: any) {
                console.error("Form submission error:", error)
                toast.error(error.message || "Failed to submit form");
            }
        },
    })

    return (
        <div className="space-y-4 py-4">
            <form
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
                className="space-y-4"
            >
                <div className="flex justify-center mb-6">
                    <form.Field
                        name="imageUrl"
                        children={(field) => (
                            <ImageUpload
                                value={field.state.value}
                                onChange={(url) => field.handleChange(url)}
                                onRemove={() => field.handleChange(null)}
                            />
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="firstName"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>First Name</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
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
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="phone"
                        children={(field) => (
                            <div className="space-y-1">
                                <Label htmlFor={field.name}>Phone</Label>
                                <PhoneInput
                                    value={field.state.value}
                                    onChange={(phone) => field.handleChange(phone)}
                                    error={!!field.state.meta.errors.length && field.state.meta.isTouched}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />

                    <form.Field
                        name="email"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Email</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="email"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="password"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Password {employee ? "(Leave blank to keep)" : "*"}</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="password"
                                    value={field.state.value || ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={employee ? "••••••••" : "Enter password"}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="department"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Department</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                    <form.Field
                        name="designation"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Designation</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="joiningDate"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Joining Date</Label>
                                <DatePicker
                                    id={field.name}
                                    name={field.name}
                                    value={(() => {
                                        try {
                                            return field.state.value ? [parseDate(field.state.value)] : []
                                        } catch (e) {
                                            return []
                                        }
                                    })()}
                                    onValueChange={(details) => {
                                        if (details.value && details.value[0]) {
                                            field.handleChange(details.value[0].toString())
                                        } else {
                                            field.handleChange('')
                                        }
                                    }}
                                    placeholder="Select date"
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                    <form.Field
                        name="salary"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Salary</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(Number(e.target.value))}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                <div className="hidden">
                    {/* Buttons are now handled externally via formId */}
                    <Button type="submit" id="submit-employee-form">Submit</Button>
                </div>
            </form>
        </div>
    )
}

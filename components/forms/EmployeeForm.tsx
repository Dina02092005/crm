"use client"

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/useApi'
import { Employee } from '@/types/api'
import { PhoneInput } from '@/components/ui/phone-input'

const employeeSchema = z.object({
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
    email: z.string(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    department: z.string(),
    designation: z.string(),
    joiningDate: z.string(),
    salary: z.number(),
})

interface EmployeeFormProps {
    employee?: Employee
    onSuccess?: () => void
    formId?: string
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
        },
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            onChange: employeeSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                const payload = {
                    ...value,
                    salary: Number(value.salary)
                }
                if (employee && employee.id) {
                    await updateMutation.mutateAsync({ id: employee.id, data: payload })
                } else {
                    // @ts-ignore
                    await createMutation.mutateAsync(payload)
                }
                onSuccess?.()
            } catch (error) {
                console.error("Form submission error:", error)
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
                                {field.state.meta.errors ? (
                                    <p className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
                                ) : null}
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
                                {field.state.meta.errors ? (
                                    <p className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
                                ) : null}
                            </div>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="phone"
                        children={(field) => (
                            <div className="space-y-1">
                                <Label htmlFor={field.name} className={field.state.meta.errors ? "text-red-500" : ""}>Phone</Label>
                                <PhoneInput
                                    value={field.state.value}
                                    onChange={(phone) => field.handleChange(phone)}
                                    error={!!field.state.meta.errors}
                                />
                                {field.state.meta.errors ? (
                                    <p className="text-sm text-red-500">
                                        {field.state.meta.errors.map(e => typeof e === 'object' ? (e as any).message || JSON.stringify(e) : e).join(', ')}
                                    </p>
                                ) : null}
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
                                {field.state.meta.errors ? (
                                    <p className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
                                ) : null}
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
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="date"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
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

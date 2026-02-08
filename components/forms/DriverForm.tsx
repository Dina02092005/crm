"use client"

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateDriver, useUpdateDriver } from '@/hooks/useApi'
import { Driver } from '@/types/api'
import { PhoneInput } from '@/components/ui/phone-input'
import { AddressSelector } from '@/components/ui/address-selector'

const driverSchema = z.object({
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
    email: z.string(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    licenseNumber: z.string(),
    vehicleType: z.string(),
    vehicleModel: z.string(),
    vehiclePlate: z.string(),
    vehicleColor: z.string(),
    address: z.string(),
})

interface DriverFormProps {
    driver?: Driver
    onSuccess?: () => void
    formId?: string
}

export default function DriverForm({ driver, onSuccess, formId }: DriverFormProps) {
    const createMutation = useCreateDriver()
    const updateMutation = useUpdateDriver()

    const form = useForm({
        defaultValues: {
            phone: driver?.phone || '',
            email: driver?.email || '',
            firstName: driver?.firstName || '',
            lastName: driver?.lastName || '',
            licenseNumber: driver?.licenseNumber || '',
            vehicleType: driver?.vehicleType || '',
            vehicleModel: driver?.vehicleModel || '',
            vehiclePlate: driver?.vehiclePlate || '',

            vehicleColor: driver?.vehicleColor || '',
            address: driver?.address || '',
        },
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            onChange: driverSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                if (driver && driver.id) {
                    await updateMutation.mutateAsync({ id: driver.id, data: value })
                } else {
                    // @ts-ignore
                    await createMutation.mutateAsync(value)
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

                <form.Field
                    name="licenseNumber"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>License Number</Label>
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

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="vehicleType"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Vehicle Type</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Car, Bike, Auto"
                                />
                            </div>
                        )}
                    />
                    <form.Field
                        name="vehicleModel"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Vehicle Model</Label>
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
                        name="vehiclePlate"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Vehicle Plate</Label>
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
                        name="vehicleColor"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Vehicle Color</Label>
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

                <form.Field
                    name="address"
                    children={(field) => (
                        <AddressSelector
                            value={field.state.value}
                            onChange={(val) => field.handleChange(val)}
                            error={field.state.meta.errors ? field.state.meta.errors.join(', ') : undefined}
                        />
                    )}
                />

                <div className="hidden">
                    {/* Buttons are now handled externally via formId */}
                    <Button type="button" id="submit-driver-form">Submit</Button>
                </div>
            </form>
        </div>
    )
}

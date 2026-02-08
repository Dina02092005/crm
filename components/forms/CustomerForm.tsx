"use client"

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useApi'
import { Customer } from '@/types/api'
import { useEffect } from 'react'
import { PhoneInput } from '@/components/ui/phone-input'
import { AddressSelector } from '@/components/ui/address-selector'

const customerSchema = z.object({
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    savedAddresses: z.array(z.object({
        name: z.string().min(1, 'Label is required'),
        address: z.string().min(1, 'Address is required'),
        city: z.string(),
        state: z.string(),
        country: z.string(),
        isDefault: z.boolean().optional(),
    })),
})

interface CustomerFormProps {
    customer?: Customer
    onSuccess?: () => void
    formId?: string
}

export default function CustomerForm({ customer, onSuccess, formId }: CustomerFormProps) {
    const createMutation = useCreateCustomer()
    const updateMutation = useUpdateCustomer()

    const form = useForm({
        defaultValues: {
            phone: customer?.user?.phone || customer?.phone || '',
            email: customer?.user?.email || customer?.email || '',
            firstName: customer?.user?.firstName || customer?.firstName || '',
            lastName: customer?.user?.lastName || customer?.lastName || '',
            savedAddresses: customer?.savedAddresses || [],
        },
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            onBlur: customerSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                if (customer?.id) {
                    await updateMutation.mutateAsync({ id: customer.id, data: value })
                } else {
                    await createMutation.mutateAsync(value)
                }
                onSuccess?.()
            } catch (error) {
                console.error('Form submission error:', error)
            }
        },
    })

    useEffect(() => {
        if (customer) {
            form.setFieldValue('phone', customer?.user?.phone || customer?.phone || '')
            form.setFieldValue('email', customer?.user?.email || customer?.email || '')
            form.setFieldValue('firstName', customer?.user?.firstName || customer?.firstName || '')
            form.setFieldValue('lastName', customer?.user?.lastName || customer?.lastName || '')
            form.setFieldValue('savedAddresses', customer?.savedAddresses || [])
        }
    }, [customer])

    return (
        <div className="py-2">
            <form
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
                className="space-y-8"
            >
                {/* Personal Information */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b">
                        <div className="h-1 w-1 rounded-full bg-primary"></div>
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                    />
                                    {field.state.meta.errors && field.state.meta.isTouched ? (
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
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    {field.state.meta.errors && field.state.meta.isTouched ? (
                                        <p className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
                                    ) : null}
                                </div>
                            )}
                        />
                    </div>

                    <form.Field
                        name="phone"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Phone</Label>
                                <PhoneInput
                                    value={field.state.value}
                                    onChange={(phone) => field.handleChange(phone)}
                                />
                                {field.state.meta.errors && field.state.meta.isTouched ? (
                                    <p className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
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
                                    type="email"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                {field.state.meta.errors && field.state.meta.isTouched ? (
                                    <p className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
                                ) : null}
                            </div>
                        )}
                    />
                </div>

                {/* Saved Addresses */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b">
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-primary"></div>
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Saved Addresses</h3>
                        </div>
                        <form.Field
                            name="savedAddresses"
                            mode="array"
                            children={(field) => (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => field.pushValue({
                                        name: '',
                                        address: '',
                                        city: '',
                                        state: '',
                                        country: '',
                                        isDefault: false,
                                    })}
                                    size="sm"
                                >
                                    + Add Address
                                </Button>
                            )}
                        />
                    </div>

                    <form.Field
                        name="savedAddresses"
                        mode="array"
                        children={(field) => (
                            <div className="space-y-4">
                                {field.state.value?.map((_, i) => (
                                    <div key={i} className="relative group">
                                        <div className="flex flex-col gap-5 p-5 border border-border rounded-xl bg-card hover:shadow-sm transition-shadow">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                        {i + 1}
                                                    </div>
                                                    <span className="text-sm font-medium text-muted-foreground">Address #{i + 1}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => field.removeValue(i)}
                                                >
                                                    ✕
                                                </Button>
                                            </div>

                                            <form.Field
                                                name={`savedAddresses[${i}].name`}
                                                children={(subField) => (
                                                    <div className="space-y-2">
                                                        <Label>Label (e.g. Home, Work)</Label>
                                                        <Input
                                                            value={subField.state.value}
                                                            onBlur={subField.handleBlur}
                                                            onChange={(e) => subField.handleChange(e.target.value)}
                                                            placeholder="Home, Work, etc."
                                                        />
                                                    </div>
                                                )}
                                            />

                                            <form.Field
                                                name={`savedAddresses[${i}]`}
                                                children={(subField) => (
                                                    <AddressSelector
                                                        key={`address-${i}-${subField.state.value.country || 'new'}`}
                                                        value={subField.state.value.address}
                                                        initialCountry={subField.state.value.country}
                                                        initialState={subField.state.value.state}
                                                        initialCity={subField.state.value.city}
                                                        onChange={(val) => {
                                                            // Handled by onStructuredChange
                                                        }}
                                                        onStructuredChange={(data) => {
                                                            subField.setValue({
                                                                ...subField.state.value,
                                                                address: data.address,
                                                                city: data.city,
                                                                state: data.state,
                                                                country: data.country
                                                            })
                                                        }}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                </div>

                <button type="submit" className="hidden" />
            </form>
        </div>
    )
}

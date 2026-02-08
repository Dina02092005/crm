'use client';

import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

interface DriverFormData {
    name: string;
    email: string;
    phone: string;
    licenseNumber: string;
}

export default function TanStackFormExample() {
    const [submittedData, setSubmittedData] = useState<DriverFormData | null>(null);

    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            licenseNumber: '',
        },
        onSubmit: async ({ value }) => {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSubmittedData(value as DriverFormData);
            console.log('Form submitted:', value);
        },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>TanStack Form Example</CardTitle>
                <CardDescription>
                    Type-safe form handling with validation
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-4"
                >
                    {/* Name Field */}
                    <form.Field
                        name="name"
                        validators={{
                            onChange: ({ value }) =>
                                !value ? 'Name is required' : value.length < 3 ? 'Name must be at least 3 characters' : undefined,
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Name</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Enter driver name"
                                />
                                {field.state.meta.errors && (
                                    <p className="text-sm text-destructive">
                                        {field.state.meta.errors.join(', ')}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Email Field */}
                    <form.Field
                        name="email"
                        validators={{
                            onChange: ({ value }) => {
                                if (!value) return 'Email is required';
                                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                                    return 'Invalid email address';
                                }
                                return undefined;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Email</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="email"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="driver@example.com"
                                />
                                {field.state.meta.errors && (
                                    <p className="text-sm text-destructive">
                                        {field.state.meta.errors.join(', ')}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Phone Field */}
                    <form.Field
                        name="phone"
                        validators={{
                            onChange: ({ value }) =>
                                !value ? 'Phone is required' : !/^\+?[\d\s-()]+$/.test(value) ? 'Invalid phone number' : undefined,
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Phone</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="tel"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="+1 (234) 567-8900"
                                />
                                {field.state.meta.errors && (
                                    <p className="text-sm text-destructive">
                                        {field.state.meta.errors.join(', ')}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* License Number Field */}
                    <form.Field
                        name="licenseNumber"
                        validators={{
                            onChange: ({ value }) =>
                                !value ? 'License number is required' : value.length < 5 ? 'License number must be at least 5 characters' : undefined,
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>License Number</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="DL123456"
                                />
                                {field.state.meta.errors && (
                                    <p className="text-sm text-destructive">
                                        {field.state.meta.errors.join(', ')}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <Button type="submit" disabled={!canSubmit} className="w-full">
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </Button>
                        )}
                    </form.Subscribe>
                </form>

                {submittedData && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">Submitted Data:</h3>
                        <pre className="text-sm">{JSON.stringify(submittedData, null, 2)}</pre>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

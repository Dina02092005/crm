'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    FaTable,
    FaWpforms,
    FaMap,
    FaIcons,
    FaDatabase,
    FaArrowRight,
} from 'react-icons/fa';

const examples = [
    {
        title: 'TanStack Query',
        description: 'Data fetching, caching, and state management with useQuery and useMutation',
        icon: FaDatabase,
        href: '/examples/tanstack-query',
        color: 'text-blue-500',
    },
    {
        title: 'TanStack Table',
        description: 'Advanced data tables with sorting, filtering, and pagination',
        icon: FaTable,
        href: '/examples/tanstack-table',
        color: 'text-green-500',
    },
    {
        title: 'TanStack Form',
        description: 'Type-safe form handling with validation and error management',
        icon: FaWpforms,
        href: '/examples/tanstack-form',
        color: 'text-purple-500',
    },
    {
        title: 'Leaflet Map',
        description: 'Interactive maps with markers, popups, and real-time tracking',
        icon: FaMap,
        href: '/examples/leaflet-map',
        color: 'text-orange-500',
    },
    {
        title: 'React Icons',
        description: 'Comprehensive icon library with Font Awesome icons',
        icon: FaIcons,
        href: '/examples/react-icons',
        color: 'text-pink-500',
    },
];

export default function ExamplesPage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Inter CRM Admin Examples</h1>
                <p className="text-muted-foreground">
                    Explore examples of all the technologies used in this project
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {examples.map((example) => {
                    const Icon = example.icon;
                    return (
                        <Card key={example.href} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <Icon className={`text-3xl ${example.color}`} />
                                </div>
                                <CardTitle className="mt-4">{example.title}</CardTitle>
                                <CardDescription>{example.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href={example.href}>
                                    <Button className="w-full">
                                        View Example
                                        <FaArrowRight className="ml-2" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Tech Stack Info */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Tech Stack</CardTitle>
                    <CardDescription>
                        Complete list of technologies used in this project
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold mb-2">Frontend Framework</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li>• Next.js 16 (App Router)</li>
                                <li>• React 19</li>
                                <li>• TypeScript</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">UI & Styling</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li>• Tailwind CSS v4</li>
                                <li>• shadcn/ui Components</li>
                                <li>• React Icons</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Data Management</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li>• TanStack Query (React Query)</li>
                                <li>• TanStack Table</li>
                                <li>• TanStack Form</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Utilities</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li>• Axios (HTTP Client)</li>
                                <li>• Winston (Logger)</li>
                                <li>• Leaflet (Maps)</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Setup Info */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Project Setup</CardTitle>
                    <CardDescription>
                        Key configurations and utilities
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Axios Instance</h3>
                            <p className="text-sm text-muted-foreground">
                                Pre-configured HTTP client with interceptors for authentication and logging
                            </p>
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                                lib/axios.ts
                            </code>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Logger Configuration</h3>
                            <p className="text-sm text-muted-foreground">
                                Winston logger with multiple transports and custom formatting
                            </p>
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                                lib/logger.ts
                            </code>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Query Provider</h3>
                            <p className="text-sm text-muted-foreground">
                                TanStack Query provider with default options and dev tools
                            </p>
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                                providers/query-provider.tsx
                            </code>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

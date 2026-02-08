'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Example API types
interface User {
    id: number;
    name: string;
    email: string;
}

// Example API functions
const fetchUsers = async (): Promise<User[]> => {
    const response = await axiosInstance.get('/users');
    return response.data;
};

const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const response = await axiosInstance.post('/users', user);
    return response.data;
};

export default function TanStackQueryExample() {
    const queryClient = useQueryClient();

    // Query example
    const { data: users, isLoading, error, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
    });

    // Mutation example
    const createUserMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            // Invalidate and refetch users query after successful creation
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const handleCreateUser = () => {
        createUserMutation.mutate({
            name: 'John Doe',
            email: 'john@example.com',
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p>Loading users...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-destructive">Error: {error.message}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>TanStack Query Example</CardTitle>
                <CardDescription>
                    Fetching and mutating data with TanStack Query
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Button onClick={() => refetch()}>Refresh Users</Button>
                    <Button
                        onClick={handleCreateUser}
                        disabled={createUserMutation.isPending}
                    >
                        {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                    </Button>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold">Users:</h3>
                    {users?.map((user) => (
                        <div key={user.id} className="p-2 border rounded">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    ))}
                </div>

                {createUserMutation.isError && (
                    <p className="text-destructive text-sm">
                        Error creating user: {createUserMutation.error.message}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

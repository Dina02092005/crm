import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getCustomers, createCustomer, updateCustomer, deleteCustomer,
    getEmployees, createEmployee, updateEmployee, deleteEmployee
} from '../services/api';

import { toast } from 'sonner';

// Customers
export const useCustomers = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['customers', page, limit],
        queryFn: async () => {
            return await getCustomers(page, limit);
        },
    });
};

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCustomer,
        onSuccess: (response: any) => {
            toast.success(response.message || 'Customer created successfully');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateCustomer(id, data),
        onSuccess: (response: any) => {
            toast.success(response.message || 'Customer updated successfully');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCustomer,
        onSuccess: (response: any) => {
            toast.success(response?.message || 'Customer deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

// Employees
export const useEmployees = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['employees', page, limit],
        queryFn: async () => {
            return await getEmployees(page, limit);
        },
    });
};

export const useCreateEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};

export const useUpdateEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateEmployee(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};

export const useDeleteEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};


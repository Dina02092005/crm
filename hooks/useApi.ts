import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getCustomers, createCustomer, updateCustomer, deleteCustomer,
    getDrivers, createDriver, updateDriver, deleteDriver,
    getEmployees, createEmployee, updateEmployee, deleteEmployee
} from '../services/api';

import { toast } from 'sonner';

// Customers
export const useCustomers = () => {
    return useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const response = await getCustomers();
            return response.data;
        },
    });
};

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCustomer,
        onSuccess: (response) => {
            toast.success(response.message);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateCustomer(id, data),
        onSuccess: (response) => {
            toast.success(response.message);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCustomer,
        onSuccess: (response) => {
            toast.success(response.message);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

// Employees
export const useEmployees = () => {
    return useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const response = await getEmployees();
            return response.data;
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

// Drivers
export const useDrivers = () => {
    return useQuery({
        queryKey: ['drivers'],
        queryFn: async () => {
            const response = await getDrivers();
            return response.data;
        },
    });
};

export const useCreateDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
        },
    });
};

export const useUpdateDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateDriver(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
        },
    });
};

export const useDeleteDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
        },
    });
};

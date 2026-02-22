import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getStudents, createStudent, updateStudent, deleteStudent,
    getEmployees, createEmployee, updateEmployee, deleteEmployee
} from '../services/api';

import { toast } from 'sonner';

// Students
export const useStudents = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['students', page, limit],
        queryFn: async () => {
            return await getStudents(page, limit);
        },
    });
};

export const useCreateStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createStudent,
        onSuccess: (response: any) => {
            toast.success(response.message || 'Student created successfully');
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
};

export const useUpdateStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateStudent(id, data),
        onSuccess: (response: any) => {
            toast.success(response.message || 'Student updated successfully');
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
};

export const useDeleteStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteStudent,
        onSuccess: (response: any) => {
            toast.success(response?.message || 'Student deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['students'] });
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


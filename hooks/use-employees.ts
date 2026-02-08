import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { User } from "@prisma/client"; // Assuming Employee uses User model? Or Employee? Checking.

// Based on previous files, it seems Employees might be Users with specific roles.
// Let's assume 'User' or 'Employee' model. Providing 'any' for now or checking schema is better.
// Checking 'EmployeesTable.tsx' usage would be good.
// But to proceed, I will use 'any' temporarily or 'User' if I can verify.
// I'll stick to a generic approach or 'User'.

interface EmployeeStats {
    total: number;
    active: number;
    inactive: number;
}

export function useEmployeeStats() {
    return useQuery({
        queryKey: ["employee-stats"],
        queryFn: async () => {
            const { data } = await axios.get<EmployeeStats>("/api/employees/stats");
            return data;
        },
    });
}

interface Employee extends User {
    // any extra fields
}

export const useEmployees = (status: string = "all", page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ["employees", status, page, limit],
        queryFn: async () => {
            const params = new URLSearchParams({
                status,
                page: page.toString(),
                limit: limit.toString(),
            });
            const { data } = await axios.get(`/api/employees?${params}`);
            // If the API returns { employees, pagination }, handle it.
            // Assuming current API might return array, but we updated api/employees/route.ts to return { employees, pagination }
            return data;
        },
    });
};

export function useEmployee(id: string) {
    return useQuery({
        queryKey: ["employee", id],
        queryFn: async () => {
            const { data } = await axios.get<Employee>(`/api/employees/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (employeeData: any) => {
            const { data } = await axios.post("/api/employees", employeeData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
        },
    });
}

export function useUpdateEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await axios.patch(`/api/employees/${id}`, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
            queryClient.invalidateQueries({ queryKey: ["employee", variables.id] });
        },
    });
}

export function useToggleEmployeeStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const response = await axios.patch(`/api/employees/${id}`, { isActive });
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
            queryClient.invalidateQueries({ queryKey: ["employee", variables.id] });
        },
    });
}

export function useDeleteEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/employees/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
        },
    });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
// import { Customer } from "@prisma/client"; // Verify Customer model existence

// Assuming Customer model exists or using any for now
interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    // ... other fields
}

interface FetchCustomersParams {
    search?: string;
    page?: number;
    limit?: number;
}

export function useCustomers({ search = "", page = 1, limit = 10 }: FetchCustomersParams = {}) {
    return useQuery({
        queryKey: ["customers", { search, page, limit }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            params.append("page", page.toString());
            params.append("limit", limit.toString());

            const { data } = await axios.get<{ customers: Customer[]; total: number; totalPages: number }>(
                `/api/customers?${params.toString()}`
            );
            return data;
        },
    });
}

export function useCustomer(id: string) {
    return useQuery({
        queryKey: ["customer", id],
        queryFn: async () => {
            const { data } = await axios.get<Customer>(`/api/customers/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (customerData: Partial<Customer>) => {
            const { data } = await axios.post("/api/customers", customerData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
            const response = await axios.patch(`/api/customers/${id}`, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
        },
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/customers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
}

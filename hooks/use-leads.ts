import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Lead } from '@/lib/prisma';

interface LeadsResponse {
    leads: Lead[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface LeadStats {
    ALL: number;
    NEW: number;
    ASSIGNED: number;
    IN_PROGRESS: number;
    FOLLOW_UP: number;
    CONVERTED: number;
    LOST: number;
}

export function useLeadStats() {
    return useQuery({
        queryKey: ["lead-stats"],
        queryFn: async () => {
            const { data } = await axios.get<LeadStats>("/api/leads/stats");
            return data;
        },
    });
}

interface FetchLeadsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    assignedTo?: string;
    interestedCountry?: string;
    highestQualification?: string;
    interest?: string;
    source?: string;
    from?: string;
    to?: string;
}

export function useLeads({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    assignedTo = "",
    interestedCountry = "",
    highestQualification = "",
    interest = "",
    source = "",
    from = "",
    to = ""
}: FetchLeadsParams) {
    return useQuery({
        queryKey: ["leads", { page, limit, search, status, assignedTo, interestedCountry, highestQualification, interest, source, from, to }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (status && status !== "ALL") params.append("status", status);
            if (assignedTo) params.append("assignedTo", assignedTo);
            if (interestedCountry) params.append("interestedCountry", interestedCountry);
            if (highestQualification) params.append("highestQualification", highestQualification);
            if (interest) params.append("interest", interest);
            if (source) params.append("source", source);
            if (from) params.append("from", from);
            if (to) params.append("to", to);
            params.append("page", page.toString());
            params.append("limit", limit.toString());

            const { data } = await axios.get<LeadsResponse>(`/api/leads?${params.toString()}`);
            return data;
        },
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    });
}

export function useLead(id: string) {
    return useQuery({
        queryKey: ["lead", id],
        queryFn: async () => {
            const { data } = await axios.get<Lead>(`/api/leads/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (leadData: Partial<Lead>) => {
            const { data } = await axios.post("/api/leads", leadData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
        },
    });
}

export function useUpdateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
            const response = await axios.patch(`/api/leads/${id}`, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
            queryClient.invalidateQueries({ queryKey: ["lead", variables.id] });
        },
    });
}

export function useDeleteLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/leads/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
        },
    });
}

export function useBulkDeleteLeads() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ids: string[]) => {
            await axios.delete("/api/leads/bulk", { data: { ids } });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
            toast.success(`${variables.length} leads deleted successfully`);
        },
    });
}

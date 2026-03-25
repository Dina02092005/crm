import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export function useCountries(page = 1, limit = 25, search = "") {
    return useQuery({
        queryKey: ["countries", page, limit, search],
        queryFn: async () => {
            const { data } = await axios.get("/api/master/countries", {
                params: { page, limit, search }
            });
            return data;
        },
    });
}

export function useCountriesWithUniversityCount(page = 1, limit = 25, search = "") {
    return useQuery({
        queryKey: ["countries-with-count", page, limit, search],
        queryFn: async () => {
            const { data } = await axios.get("/api/master/countries-with-university-count", {
                params: { page, limit, search }
            });
            return data;
        },
    });
}

export function useBulkDeleteCountries() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: string[]) => {
            await axios.delete("/api/master/countries/bulk", { data: { ids } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["countries"] });
            queryClient.invalidateQueries({ queryKey: ["countries-with-count"] });
        },
    });
}

export function useUniversities(countryId?: string, page = 1, limit = 25, search = "") {
    return useQuery({
        queryKey: ["universities", countryId, page, limit, search],
        queryFn: async () => {
            const { data } = await axios.get("/api/master/universities", {
                params: { countryId, page, limit, search }
            });
            return data;
        },
    });
}

export function useBulkDeleteUniversities() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: string[]) => {
            await axios.delete("/api/master/universities/bulk", { data: { ids } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["universities"] });
            queryClient.invalidateQueries({ queryKey: ["countries-with-count"] });
        },
    });
}

export function useBulkDeleteCourses() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: string[]) => {
            await axios.delete("/api/master/courses/bulk", { data: { ids } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
    });
}

export function useCourses(params: { universityId?: string, countryId?: string, page?: number, limit?: number, search?: string } = {}) {
    return useQuery({
        queryKey: ["courses", params],
        queryFn: async () => {
            const { data } = await axios.get("/api/master/courses", { params });
            return data;
        },
    });
}

export function useCounselors() {
    return useQuery({
        queryKey: ["counselors"],
        queryFn: async () => {
            const { data } = await axios.get("/api/employees?role=COUNSELOR&limit=100");
            return data.employees || [];
        },
    });
}

export function useQualifications(page = 1, limit = 25, search = "") {
    return useQuery({
        queryKey: ["qualifications", page, limit, search],
        queryFn: async () => {
            const { data } = await axios.get("/api/master/qualifications", {
                params: { page, limit, search }
            });
            return data;
        },
    });
}

export function useWebsites(page = 1, limit = 25, search = "") {
    return useQuery({
        queryKey: ["websites", page, limit, search],
        queryFn: async () => {
            const { data } = await axios.get("/api/websites", {
                params: { page, limit, search }
            });
            return data;
        },
    });
}

export function useBulkDeleteWebsites() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: string[]) => {
            await axios.delete("/api/websites/bulk", { data: { ids } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["websites"] });
        },
    });
}

export function useBulkDeleteQualifications() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: string[]) => {
            await axios.delete("/api/master/qualifications/bulk", { data: { ids } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["qualifications"] });
        },
    });
}

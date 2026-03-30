"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface ReportFilters {
    from?: string;
    to?: string;
    agentId?: string;
    counselorId?: string;
    source?: string;
    country?: string;
    status?: string;
    temperature?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export function useReportFilters() {
    return useQuery({
        queryKey: ["report-filters"],
        queryFn: async () => {
            const { data } = await axios.get("/api/reports/filters");
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useReportAnalytics(filters: ReportFilters) {
    return useQuery({
        queryKey: ["report-analytics", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, String(value));
            });
            const { data } = await axios.get(`/api/reports/analytics?${params.toString()}`);
            return data;
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 30, // 30 seconds as per requirement
    });
}

export function useReportLeads(filters: ReportFilters) {
    return useQuery({
        queryKey: ["report-leads", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, String(value));
            });
            const { data } = await axios.get(`/api/reports/leads?${params.toString()}`);
            return data;
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 30,
    });
}

export function useReportStudents(filters: ReportFilters) {
    return useQuery({
        queryKey: ["report-students", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, String(value));
            });
            const { data } = await axios.get(`/api/reports/students?${params.toString()}`);
            return data;
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 30,
    });
}

export function useReportApplications(filters: ReportFilters) {
    return useQuery({
        queryKey: ["report-applications", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, String(value));
            });
            const { data } = await axios.get(`/api/reports/applications?${params.toString()}`);
            return data;
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 30,
    });
}

export function useReportVisa(filters: ReportFilters) {
    return useQuery({
        queryKey: ["report-visa", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, String(value));
            });
            const { data } = await axios.get(`/api/reports/visa?${params.toString()}`);
            return data;
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 30,
    });
}

export function useReportPerformance(filters: ReportFilters) {
    return useQuery({
        queryKey: ["report-performance", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, String(value));
            });
            const { data } = await axios.get(`/api/reports/performance?${params.toString()}`);
            return data;
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 30,
    });
}

export function useReportActivities(filters: ReportFilters) {
    return useQuery({
        queryKey: ["report-activities", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, String(value));
            });
            const { data } = await axios.get(`/api/reports/activities?${params.toString()}`);
            return data;
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 30,
    });
}

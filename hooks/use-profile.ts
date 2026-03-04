import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { User } from '@/lib/prisma';

// Assuming User type from Prisma
// We might need to extend it if profile has joined data

interface UserProfile extends User {
    employeeProfile?: {
        phone: string;
        department: string;
        // add other fields if needed
    } | null;
    studentProfile?: {
        id: string;
    } | null;
}

export function useProfile() {
    return useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const { data } = await axios.get<UserProfile>("/api/profile");
            return data;
        },
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profileData: Partial<UserProfile> & { phone?: string; department?: string }) => {
            const { data } = await axios.patch("/api/profile", profileData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            // Optionally invalidate 'session' if we were using it for this
        },
    });
}

export function useStudentProfile() {
    return useQuery({
        queryKey: ["student-profile"],
        queryFn: async () => {
            const { data } = await axios.get("/api/student/profile");
            return data;
        },
    });
}

export function useUpdateStudentProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profileData: any) => {
            const { data } = await axios.patch("/api/student/profile", profileData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["student-profile"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
    });
}

export function useUpdatePassword() {
    // ... existing
    return useMutation({
        mutationFn: async (passwordData: any) => {
            const { data } = await axios.post("/api/profile/password", passwordData);
            return data;
        },
    });
}

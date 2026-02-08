import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { User } from "@prisma/client";

// Assuming User type from Prisma
// We might need to extend it if profile has joined data

interface UserProfile extends User {
    employeeProfile?: {
        phone: string;
        department: string;
        // add other fields if needed
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

export function useUpdatePassword() {
    return useMutation({
        mutationFn: async (passwordData: any) => {
            const { data } = await axios.post("/api/profile/password", passwordData);
            return data;
        },
    });
}

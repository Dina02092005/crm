import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
    getStudents, createStudent, updateStudent, deleteStudent,
    getEmployees, createEmployee, updateEmployee, deleteEmployee, deleteEmployeesBulk,
    getApplications, createApplication, updateApplication, deleteApplication, deleteApplicationsBulk,
    getVisaApplications, createVisaApplication, updateVisaApplication, deleteVisaApplication,
    deleteStudentsBulk, deleteVisaApplicationsBulk, deleteRolesBulk
} from '../services/api';

import { toast } from 'sonner';

interface Stats {
    [key: string]: number;
}

// Students
export const useStudents = (page = 1, limit = 10, search = "", status = "", onboardedBy = "", interestedCountry = "", intake = "", agentId = "", counselorId = "", countryId = "", appIntake = "") => {
    return useQuery({
        queryKey: ['students', page, limit, search, status, onboardedBy, interestedCountry, intake, agentId, counselorId, countryId, appIntake],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            if (search) params.append("search", search);
            if (status && status !== 'ALL') params.append("status", status);
            if (onboardedBy) params.append("onboardedBy", onboardedBy);
            if (interestedCountry) params.append("interestedCountry", interestedCountry);
            if (intake) params.append("intake", intake);
            if (agentId) params.append("agentId", agentId);
            if (counselorId) params.append("counselorId", counselorId);
            if (countryId) params.append("countryId", countryId);
            if (appIntake) params.append("appIntake", appIntake);

            const { data } = await axios.get(`/api/students?${params.toString()}`);
            return data;
        },
    });
};

export const useStudentStats = () => {
    return useQuery({
        queryKey: ['student-stats'],
        queryFn: async () => {
            const { data } = await axios.get<Stats>('/api/students/stats');
            return data;
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

export const useBulkDeleteStudents = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteStudentsBulk,
        onSuccess: (response: any) => {
            toast.success(response?.message || 'Students deleted successfully');
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

export const useBulkDeleteEmployees = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEmployeesBulk,
        onSuccess: (response: any) => {
            toast.success(response?.message || 'Employees deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};

// Applications
export const useApplications = (page = 1, limit = 10, search = '', status: string | null = null, studentId?: string, universityId?: string, countryId?: string, assignedToId?: string, courseId?: string) => {
    return useQuery({
        queryKey: ['applications', page, limit, search, status, studentId, universityId, countryId, assignedToId, courseId],
        queryFn: async () => {
             const params = new URLSearchParams();
             params.append("page", page.toString());
             params.append("limit", limit.toString());
             if (search) params.append("search", search);
             if (status && status !== 'ALL') params.append("status", status);
             if (studentId) params.append("studentId", studentId);
             if (universityId) params.append("universityId", universityId);
             if (countryId) params.append("countryId", countryId);
             if (assignedToId) params.append("assignedToId", assignedToId);
             if (courseId) params.append("courseId", courseId);

             const { data } = await axios.get(`/api/applications?${params.toString()}`);
             return data;
        },
    });
};

export const useApplicationStats = () => {
    return useQuery({
        queryKey: ['application-stats'],
        queryFn: async () => {
            const { data } = await axios.get<Stats>('/api/applications/stats');
            return data;
        },
    });
};

export const useUpdateApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateApplication(id, data),
        onSuccess: () => {
            toast.success('Application updated successfully');
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        },
    });
};

export const useDeleteApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteApplication,
        onSuccess: () => {
            toast.success('Application deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        },
    });
};

export const useBulkDeleteApplications = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteApplicationsBulk,
        onSuccess: () => {
            toast.success('Applications deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        },
    });
};

// Visa Applications
export const useVisaApplications = (studentId?: string, page = 1, limit = 10, search = "", status = "", countryId = "", visaType = "", intake = "", agentId = "", counselorId = "") => {
    return useQuery({
        queryKey: ['visa-applications', studentId, page, limit, search, status, countryId, visaType, intake, agentId, counselorId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (studentId) params.append("studentId", studentId);
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            if (search) params.append("search", search);
            if (status && status !== 'ALL') params.append("status", status);
            if (countryId) params.append("countryId", countryId);
            if (visaType) params.append("visaType", visaType);
            if (intake) params.append("intake", intake);
            if (agentId) params.append("agentId", agentId);
            if (counselorId) params.append("counselorId", counselorId);

            const { data } = await axios.get(`/api/visa-applications?${params.toString()}`);
            return data;
        },
    });
};

export const useVisaStats = () => {
    return useQuery({
        queryKey: ['visa-stats'],
        queryFn: async () => {
            const { data } = await axios.get<Stats>('/api/visa-applications/stats');
            return data;
        },
    });
};

export const useCreateVisaApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createVisaApplication,
        onSuccess: () => {
            toast.success('Visa application created successfully');
            queryClient.invalidateQueries({ queryKey: ['visa-applications'] });
        },
    });
};

export const useUpdateVisaApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateVisaApplication(id, data),
        onSuccess: () => {
            toast.success('Visa application updated successfully');
            queryClient.invalidateQueries({ queryKey: ['visa-applications'] });
        },
    });
};

export const useDeleteVisaApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteVisaApplication,
        onSuccess: () => {
            toast.success('Visa application deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['visa-applications'] });
        },
    });
};

export const useBulkDeleteVisaApplications = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteVisaApplicationsBulk,
        onSuccess: (response: any) => {
            toast.success(response?.message || 'Visa applications deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['visa-applications'] });
        },
    });
};

export const useBulkDeleteRoles = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteRolesBulk,
        onSuccess: (response: any) => {
            toast.success(response?.message || 'Roles deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
};

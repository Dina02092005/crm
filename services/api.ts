import api from '../lib/axios';
import { Student, Employee, ApiResponse } from '../types/api';

export const getStudents = async (page = 1, limit = 10): Promise<{ students: Student[], pagination: any }> => {
    return api.get(`/students?page=${page}&limit=${limit}`);
};

export const createStudent = async (data: Partial<Student>): Promise<Student> => {
    return api.post('/students', data);
};

export const updateStudent = async (id: string, data: Partial<Student>): Promise<Student> => {
    return api.patch(`/students/${id}`, data);
};

export const deleteStudent = async (id: string): Promise<void> => {
    return api.delete(`/students/${id}`);
};

export const getEmployees = async (page = 1, limit = 10): Promise<{ employees: Employee[], pagination: any }> => {
    return api.get(`/employees?page=${page}&limit=${limit}`);
};

export const createEmployee = async (data: Partial<Employee>): Promise<Employee> => {
    return api.post('/employees', data);
};

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<Employee> => {
    return api.patch(`/employees/${id}`, data);
};

export const deleteEmployee = async (id: string): Promise<void> => {
    return api.delete(`/employees/${id}`);
};

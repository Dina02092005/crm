import api from '../lib/axios';
import { Customer, Employee, ApiResponse } from '../types/api';

export const getCustomers = async (page = 1, limit = 10): Promise<{ customers: Customer[], pagination: any }> => {
    return api.get(`/customers?page=${page}&limit=${limit}`);
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
    return api.post('/customers', data);
};

export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
    return api.patch(`/customers/${id}`, data);
};

export const deleteCustomer = async (id: string): Promise<void> => {
    return api.delete(`/customers/${id}`);
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

import api from '../lib/axios';
import { Customer, Driver, Employee, ApiResponse } from '../types/api';

export const getCustomers = async (): Promise<ApiResponse<Customer[]>> => {
    return api.get('/customers');
};

export const createCustomer = async (data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    return api.post('/customers', data);
};

export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    return api.patch(`/customers/${id}`, data);
};

export const deleteCustomer = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/customers/${id}`);
};

export const getEmployees = async (): Promise<ApiResponse<Employee[]>> => {
    return api.get('/employees');
};

export const createEmployee = async (data: Partial<Employee>): Promise<ApiResponse<Employee>> => {
    return api.post('/employees', data);
};

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<ApiResponse<Employee>> => {
    return api.patch(`/employees/${id}`, data);
};

export const deleteEmployee = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/employees/${id}`);
};

export const getDrivers = async (): Promise<ApiResponse<Driver[]>> => {
    return api.get('/drivers');
};

export const createDriver = async (data: Partial<Driver>): Promise<ApiResponse<Driver>> => {
    return api.post('/drivers', data);
};

export const updateDriver = async (id: string, data: Partial<Driver>): Promise<ApiResponse<Driver>> => {
    return api.patch(`/drivers/${id}`, data);
};

export const deleteDriver = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/drivers/${id}`);
};

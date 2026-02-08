export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    role: string;
    isActive: boolean;
    profilePicture?: string | null;
}

export interface SavedAddress {
    id?: string;
    name: string; // e.g. Home, Work
    address: string;
    city: string;
    state: string;
    country: string;
    isDefault?: boolean;
}

export interface Customer {
    id: string;
    userId: string;
    address?: string;
    dob?: string;
    gender?: string;
    items?: any[]; // For array of items if needed
    user?: User; // Nested user object from API
    createdAt?: string;
    updatedAt?: string;
    // Keep these as optional for flat structure support if needed, or remove if strict
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    savedAddresses?: SavedAddress[];
}

export interface Employee {
    id: string;
    phone: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    department?: string;
    designation?: string;
    joiningDate?: string;
    salary?: number;
    createdAt?: string;
    updatedAt?: string;
}


export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data: T;
    errors?: any;
}

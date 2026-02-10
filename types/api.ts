export interface User {
    id: string;
    firstName: string;
    lastName: string;
    name?: string; // Derived or direct name
    email?: string;
    phone: string;
    role: string;
    isActive: boolean;
    profilePicture?: string | null;
    imageUrl?: string | null;
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
    name?: string; // Full name from DB
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
    imageUrl?: string | null;
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
    imageUrl?: string | null;
}

export interface Lead {
    id?: string;
    name: string;
    email?: string;
    phone: string;
    source?: string; // e.g., Website, Referral, Cold Call
    status?: string; // e.g., New, Contacted, Qualified, Unqualified
    message?: string;
    campaignId?: string;
    temperature?: string; // HOT, WARM, COLD
    imageUrl?: string | null;
}

export interface CreateLeadDTO {
    name: string;
    email?: string;
    phone: string;
    source?: string;
    status?: string;
    temperature?: string;
    message?: string;
    imageUrl?: string | null;
}

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data: T;
    errors?: any;
}

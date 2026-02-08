import axios from 'axios';
import { toast } from 'sonner';

// Backend is running on port 4000 as per .env.local
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => {
        // Return the whole response wrapper { status, message, data }
        return response.data;
    },
    (error) => {
        let message = 'An unexpected error occurred';

        if (error.response?.data) {
            // Handle standardized backend error
            const errorData = error.response.data;
            message = errorData.error || errorData.message || message;
        } else if (error.message) {
            message = error.message;
        }

        toast.error(message);
        return Promise.reject(error);
    }
);

export default api;

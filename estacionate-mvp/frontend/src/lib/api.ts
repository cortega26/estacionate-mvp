import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Assuming backend runs on 3000 locally
export const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
        withCredentials: true // Send Cookies
    });

// Request interceptor (Optional now, maybe for logging)
api.interceptors.request.use((config) => {
    return config;
});

// Response interceptor to handle 401 (optional logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

import { describe, test, expect } from 'vitest';
import apiClient from '../utils/apiClient.js';

describe('apiClient', () => {
    test('is an axios instance (has get/post/put/delete methods)', () => {
        expect(typeof apiClient.get).toBe('function');
        expect(typeof apiClient.post).toBe('function');
        expect(typeof apiClient.put).toBe('function');
        expect(typeof apiClient.delete).toBe('function');
    });

    test('has withCredentials enabled so cookies are sent cross-origin', () => {
        expect(apiClient.defaults.withCredentials).toBe(true);
    });

    test('baseURL always routes through /api', () => {
        // Vitest reads .env automatically, so VITE_REACT_APP_BACKEND_URL may be set.
        // In either case the baseURL must end with "/api" so every request hits
        // the correct API prefix.
        expect(apiClient.defaults.baseURL).toMatch(/\/api$/);
    });
});

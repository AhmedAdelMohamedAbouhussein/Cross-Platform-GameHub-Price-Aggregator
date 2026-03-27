import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
const BACKEND_BASE = import.meta.env.MODE === "development" ? "" : BACKEND_URL;

const apiClient = axios.create({
    baseURL: `${BACKEND_BASE}/api`,
    withCredentials: true,
});

export default apiClient;

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('wealthgift_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stale auth and redirect to login preserving the current path.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('wealthgift_token');
      // Avoid redirect loop on the login page itself
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

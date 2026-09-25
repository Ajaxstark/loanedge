import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Check your .env file.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/* ---------------- REQUEST INTERCEPTOR ---------------- */
api.interceptors.request.use(
  (config) => {
    const adminToken =
      localStorage.getItem('token') || sessionStorage.getItem('token');

    const customerToken = localStorage.getItem('customer_token');

    const token = adminToken || customerToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- RESPONSE INTERCEPTOR ---------------- */
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const isCustomerRoute = window.location.pathname.startsWith('/customer');

    if (status === 401) {
      if (isCustomerRoute) {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_user');

        if (window.location.pathname !== '/customer/login') {
          window.location.href = '/customer/login';
        }
      } else {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    }

    error.displayMessage =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      window.dispatchEvent(new CustomEvent('sfwr:unauthorized'));
    }
    return Promise.reject(error);
  },
);
export function messageOf(error) {
  return (
    error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.'
  );
}
export function imageUrl(path) {
  return !path
    ? ''
    : path.startsWith('http')
      ? path
      : path.startsWith('/')
        ? path
        : `/images/${path}`;
}

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../stores/auth';

/**
 * Cliente HTTP central. Em dev, baseURL '/api' é encaminhada ao backend pelo
 * proxy do Nuxt (ver nuxt.config.ts). Anexa o access token e, em 401, tenta
 * um refresh silencioso uma única vez antes de derrubar a sessão.
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // envia o cookie httpOnly do refresh token
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const authStore = useAuthStore();
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      '/api/auth/refresh',
      {},
      { withCredentials: true },
    );
    authStore.setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    authStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthEndpoint = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      refreshing ??= refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

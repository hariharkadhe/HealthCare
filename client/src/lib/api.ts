const BASE_URL = '/api';

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;
  public warning?: string;
  public existingPatient?: any;

  constructor(message: string, statusCode = 400, details?: any, warning?: string, existingPatient?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.warning = warning;
    this.existingPatient = existingPatient;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = localStorage.getItem('token');
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
    credentials: 'include',
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || 'An unexpected error occurred';
    throw new ApiError(
      errorMsg,
      response.status,
      data?.error?.details || data?.details,
      data?.warning,
      data?.existingPatient
    );
  }

  return data;
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, any>) =>
    apiRequest<T>(url, { method: 'GET', params }),
  post: <T = any>(url: string, body?: any, params?: Record<string, any>) =>
    apiRequest<T>(url, { method: 'POST', body: JSON.stringify(body), params }),
  put: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = any>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
};

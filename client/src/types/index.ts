export * from './auth';
export * from './employee';

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  errors?: Array<{ field: string; message: string }>;
}

export interface Option {
  label: string;
  value: string;
}

export interface SelectOption {
  id: string;
  name: string;
  code?: string;
}

export interface FilterOptions {
  companies: SelectOption[];
  branches: SelectOption[];
  departments: SelectOption[];
  positions: SelectOption[];
  statuses: Array<{ value: string; label: string }>;
}
/**
 * Common API types used across the Dantify mobile application.
 */

/**
 * Standard Laravel pagination metadata.
 *
 * Used for responses returned by Laravel paginate().
 */
export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links?: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

/**
 * Standard API response wrapper.
 */
export interface ApiResponse<T> {
  message?: string;
  data: T;
}

/**
 * Standard paginated API response.
 *
 * Example:
 * {
 *   message: "Records retrieved successfully",
 *   data: {
 *     current_page: 1,
 *     data: [],
 *     ...
 *   }
 * }
 */
export type PaginatedApiResponse<T> =
  ApiResponse<PaginatedResponse<T>>;

/**
 * Common pagination query parameters.
 */
export interface PaginationParams {
  page?: number;
  per_page?: number;
}

/**
 * Common search and pagination parameters.
 */
export interface SearchPaginationParams extends PaginationParams {
  search?: string;
}
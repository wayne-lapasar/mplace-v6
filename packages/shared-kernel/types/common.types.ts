// * Common TypeScript types used across the platform

export type ID = string;
export type UUID = string;
export type Timestamp = Date;
export type ISODateString = string;

// * Result type for use cases - represents success or failure
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// * Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// * Audit metadata for entities
export interface AuditMetadata {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: ID;
  updatedBy?: ID;
}

// * Filter and sort types
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

// * Pagination DTOs

import { z } from 'zod';

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParamsDTO = z.infer<typeof PaginationParamsSchema>;

export const PaginatedResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalPages: z.number().int().nonnegative(),
  });

export interface PaginatedResultDTO<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResultDTO<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

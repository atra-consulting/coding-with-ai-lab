import { ValidationError } from './errors.js';

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface PaginationParams {
  page: number;
  size: number;
}

export interface SortParams {
  field: string;
  direction: 'ASC' | 'DESC';
}

// Per-entity allowed sort fields (camelCase as in query param → DB column name)
const ALLOWED_SORT_FIELDS: Record<string, Record<string, string>> = {
  firma: {
    name: 'name',
    industry: 'industry',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  person: {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    position: 'position',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  abteilung: {
    name: 'name',
    firmaId: 'firmaId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  adresse: {
    city: 'city',
    postalCode: 'postalCode',
    street: 'street',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  aktivitaet: {
    datum: 'datum',
    typ: 'typ',
    subject: 'subject',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  chance: {
    titel: 'titel',
    wert: 'wert',
    phase: 'phase',
    wahrscheinlichkeit: 'wahrscheinlichkeit',
    erwartetesDatum: 'erwartetesDatum',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
};

export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
  const page = query['page'] !== undefined ? parseInt(String(query['page']), 10) : 0;
  const size = query['size'] !== undefined ? parseInt(String(query['size']), 10) : 10;
  return {
    page: isNaN(page) || page < 0 ? 0 : page,
    size: isNaN(size) || size <= 0 ? 10 : Math.min(size, 200),
  };
}

export function parseSort(
  sortParam: string | string[] | undefined,
  defaultField: string,
  defaultDirection: 'ASC' | 'DESC',
  entity: string
): SortParams {
  const allowed = ALLOWED_SORT_FIELDS[entity] ?? {};

  let rawField = defaultField;
  let rawDirection = defaultDirection;

  if (sortParam) {
    // Handle both string "field,asc" and array ["field","asc"] formats
    const sortStr = Array.isArray(sortParam) ? sortParam.join(',') : sortParam;
    const parts = sortStr.split(',');
    rawField = parts[0]?.trim() ?? defaultField;
    rawDirection = (parts[1]?.trim().toUpperCase() as 'ASC' | 'DESC') ?? defaultDirection;
  }

  const dbColumn = allowed[rawField];
  if (!dbColumn) {
    throw new ValidationError(`Ungültiges Sortierfeld: ${rawField}`);
  }

  const direction: 'ASC' | 'DESC' =
    rawDirection === 'DESC' || rawDirection === 'ASC' ? rawDirection : defaultDirection;

  return { field: dbColumn, direction };
}

export function buildPage<T>(
  rows: T[],
  total: number,
  page: number,
  size: number
): PageResult<T> {
  const totalPages = size > 0 ? Math.ceil(total / size) : 0;
  return {
    content: rows,
    totalElements: total,
    totalPages,
    size,
    number: page,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

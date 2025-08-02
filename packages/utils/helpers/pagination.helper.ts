import { Request } from "express";
import { handleDatabaseOperation } from "../../error-handaler/error-middleware";
import { ValidationError } from "../../error-handaler/index";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  maxLimit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SearchableField {
  field: string;
  type?: 'string' | 'number' | 'date';
  mode?: 'insensitive' | 'default';
}

export interface SortableField {
  field: string;
  allowedValues?: string[];
}

/**
 * Extract and validate pagination parameters from request
 */
export const extractPaginationParams = (
  req: Request,
  options: {
    defaultLimit?: number;
    maxLimit?: number;
    defaultSortBy?: string;
    defaultSortOrder?: 'asc' | 'desc';
  } = {}
): PaginationParams => {
  const {
    defaultLimit = 10,
    maxLimit = 100,
    defaultSortBy = 'createdAt',
    defaultSortOrder = 'desc'
  } = options;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || defaultLimit;
  const search = req.query.search as string;
  const sortBy = (req.query.sortBy as string) || defaultSortBy;
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || defaultSortOrder;

  // Validate pagination parameters
  if (page < 1) {
    throw new ValidationError("Page number must be greater than 0");
  }

  if (limit < 1 || limit > maxLimit) {
    throw new ValidationError(`Limit must be between 1 and ${maxLimit}`);
  }

  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    throw new ValidationError("Sort order must be 'asc' or 'desc'");
  }

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    search,
    sortBy,
    sortOrder
  };
};

/**
 * Build search where clause for Prisma
 */
export const buildSearchWhere = (
  search: string | undefined,
  searchableFields: SearchableField[]
): any => {
  if (!search || !searchableFields.length) {
    return {};
  }

  const searchConditions = searchableFields.map(field => {
    switch (field.type) {
      case 'string':
        return {
          [field.field]: {
            contains: search,
            mode: field.mode || 'insensitive'
          }
        };
      case 'number':
        const numericValue = parseFloat(search);
        if (!isNaN(numericValue)) {
          return { [field.field]: numericValue };
        }
        return null;
      case 'date':
        const dateValue = new Date(search);
        if (!isNaN(dateValue.getTime())) {
          return {
            [field.field]: {
              gte: new Date(dateValue.setHours(0, 0, 0, 0)),
              lt: new Date(dateValue.setHours(23, 59, 59, 999))
            }
          };
        }
        return null;
      default:
        return {
          [field.field]: {
            contains: search,
            mode: 'insensitive'
          }
        };
    }
  }).filter(condition => condition !== null);

  return searchConditions.length > 0 ? { OR: searchConditions } : {};
};

/**
 * Build sort object for Prisma
 */
export const buildSortObject = (
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc',
  allowedSortFields: SortableField[] = []
): any => {
  const fieldToSort = sortBy || 'createdAt';
  
  // If no allowed fields specified, allow any field
  if (allowedSortFields.length === 0) {
    return { [fieldToSort]: sortOrder };
  }

  // Check if sortBy is in allowed fields
  const allowedField = allowedSortFields.find(field => field.field === fieldToSort);
  if (!allowedField) {
    throw new ValidationError(`Invalid sort field: ${fieldToSort}`);
  }

  // Check if sort value is allowed (for enum fields)
  if (allowedField.allowedValues && !allowedField.allowedValues.includes(fieldToSort)) {
    throw new ValidationError(`Invalid sort value for ${fieldToSort}`);
  }

  return { [fieldToSort]: sortOrder };
};

/**
 * Generic paginated response builder
 */
export const getPaginatedResponse = async <T>(
  model: any,
  params: PaginationParams,
  options: {
    where?: any;
    include?: any;
    select?: any;
    searchableFields?: SearchableField[];
    sortableFields?: SortableField[];
    additionalWhere?: any;
  } = {}
): Promise<PaginatedResponse<T>> => {
  const {
    where = {},
    include,
    select,
    searchableFields = [],
    sortableFields = [],
    additionalWhere = {}
  } = options;

  // Build search conditions
  const searchWhere = buildSearchWhere(params.search, searchableFields);
  
  // Build sort object
  const orderBy = buildSortObject(params.sortBy, params.sortOrder, sortableFields);

  // Combine all where conditions
  const finalWhere = {
    ...where,
    ...additionalWhere,
    ...searchWhere
  };

  // Execute queries in parallel
  const [data, totalCount] = await Promise.all([
    handleDatabaseOperation(() => 
      model.findMany({
        where: finalWhere,
        include,
        select,
        skip: params.skip,
        take: params.limit,
        orderBy
      }),
      "Fetching paginated data"
    ) as Promise<T[]>,
    handleDatabaseOperation(() =>
      model.count({ where: finalWhere }),
      "Counting total records"
    ) as Promise<number>
  ]);

  const totalPages = Math.ceil(totalCount / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      totalCount,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1
    }
  };
};

/**
 * Generic paginated endpoint wrapper
 */
export const createPaginatedEndpoint = <T>(
  model: any,
  options: {
    searchableFields?: SearchableField[];
    sortableFields?: SortableField[];
    include?: any;
    select?: any;
    defaultSortBy?: string;
    defaultSortOrder?: 'asc' | 'desc';
    maxLimit?: number;
    additionalWhereBuilder?: (req: any) => any;
    permissionChecker?: (req: any) => Promise<boolean | any>;
  } = {}
) => {
  return async (req: any, res: any): Promise<void> => {
    const {
      searchableFields = [],
      sortableFields = [],
      include,
      select,
      defaultSortBy = 'createdAt',
      defaultSortOrder = 'desc',
      maxLimit = 100,
      additionalWhereBuilder,
      permissionChecker
    } = options;

    // Check permissions if provided
    if (permissionChecker) {
      const hasPermission = await permissionChecker(req);
      if (!hasPermission) {
        throw new ValidationError("Insufficient permissions");
      }
    }

    // Extract pagination parameters
    const params = extractPaginationParams(req, {
      defaultSortBy,
      defaultSortOrder,
      maxLimit
    });

    // Build additional where conditions
    const additionalWhere = additionalWhereBuilder ? additionalWhereBuilder(req) : {};

    // Get paginated response
    const result = await getPaginatedResponse<T>(model, params, {
      include,
      select,
      searchableFields,
      sortableFields,
      additionalWhere
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      meta: {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  };
};

import { Request, Response } from "express";
import { handleDatabaseOperation, sendSuccessResponse } from "../../error-handaler/error-middleware";
import { 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError 
} from "../../error-handaler/index";
import { 
  extractPaginationParams, 
  getPaginatedResponse, 
  SearchableField, 
  SortableField 
} from "./pagination.helper";

export interface CrudOptions {
  // Permissions
  permissionChecker?: (req: Request, operation: 'create' | 'read' | 'update' | 'delete') => Promise<boolean>;
  resourcePermissionChecker?: (req: Request, resourceId: string, operation: 'read' | 'update' | 'delete') => Promise<boolean>;
  
  // Validation
  createValidator?: (data: any) => { success: boolean; error?: any; data?: any };
  updateValidator?: (data: any) => { success: boolean; error?: any; data?: any };
  
  // Data transformation
  transformInput?: (data: any, operation: 'create' | 'update') => any;
  transformOutput?: (data: any) => any;
  
  // Relations
  include?: any;
  select?: any;
  
  // Search and sort
  searchableFields?: SearchableField[];
  sortableFields?: SortableField[];
  
  // Filtering
  additionalWhereBuilder?: (req: Request) => any;
  
  // Hooks
  beforeCreate?: (data: any, req: Request) => Promise<any>;
  afterCreate?: (data: any, req: Request) => Promise<void>;
  beforeUpdate?: (data: any, resourceId: string, req: Request) => Promise<any>;
  afterUpdate?: (data: any, req: Request) => Promise<void>;
  beforeDelete?: (resourceId: string, req: Request) => Promise<void>;
  afterDelete?: (resourceId: string, req: Request) => Promise<void>;
  
  // Custom messages
  messages?: {
    created?: string;
    updated?: string;
    deleted?: string;
    fetched?: string;
    notFound?: string;
  };

  // Pagination defaults
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  maxLimit?: number;
}

export class GenericCrud<T> {
  private model: any;
  private options: CrudOptions;

  constructor(model: any, options: CrudOptions = {}) {
    this.model = model;
    this.options = {
      messages: {
        created: 'Resource created successfully',
        updated: 'Resource updated successfully',
        deleted: 'Resource deleted successfully',
        fetched: 'Resources fetched successfully',
        notFound: 'Resource not found'
      },
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      maxLimit: 100,
      ...options
    };
  }

  /**
   * Create a new resource
   */
  create = async (req: Request, res: Response): Promise<void> => {
    // Check permissions
    if (this.options.permissionChecker) {
      const hasPermission = await this.options.permissionChecker(req, 'create');
      if (!hasPermission) {
        throw new ForbiddenError("Insufficient permissions to create resource");
      }
    }

    // Validate input
    let validatedData = req.body;
    if (this.options.createValidator) {
      const validation = this.options.createValidator(req.body);
      if (!validation.success) {
        throw new ValidationError("Invalid input data", validation.error);
      }
      validatedData = validation.data || req.body;
    }

    // Transform input
    if (this.options.transformInput) {
      validatedData = this.options.transformInput(validatedData, 'create');
    }

    // Before create hook
    if (this.options.beforeCreate) {
      validatedData = await this.options.beforeCreate(validatedData, req);
    }

    // Create resource
    const resource = await handleDatabaseOperation(
      () => this.model.create({
        data: validatedData,
        include: this.options.include,
        select: this.options.select
      }),
      "Creating resource"
    );

    // After create hook
    if (this.options.afterCreate) {
      await this.options.afterCreate(resource, req);
    }

    // Transform output
    const transformedResource = this.options.transformOutput 
      ? this.options.transformOutput(resource)
      : resource;

    sendSuccessResponse(res, transformedResource, this.options.messages?.created, 201);
  };

  /**
   * Get paginated list of resources
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    // Check permissions
    if (this.options.permissionChecker) {
      const hasPermission = await this.options.permissionChecker(req, 'read');
      if (!hasPermission) {
        throw new ForbiddenError("Insufficient permissions to read resources");
      }
    }

    // Extract pagination parameters
    const params = extractPaginationParams(req, {
      defaultSortBy: this.options.defaultSortBy,
      defaultSortOrder: this.options.defaultSortOrder,
      maxLimit: this.options.maxLimit
    });

    // Build additional where conditions
    const additionalWhere = this.options.additionalWhereBuilder 
      ? this.options.additionalWhereBuilder(req) 
      : {};

    // Get paginated response
    const result = await getPaginatedResponse<T>(this.model, params, {
      include: this.options.include,
      select: this.options.select,
      searchableFields: this.options.searchableFields,
      sortableFields: this.options.sortableFields,
      additionalWhere
    });

    // Transform output
    const transformedData = this.options.transformOutput
      ? result.data.map(item => this.options.transformOutput!(item))
      : result.data;

    res.json({
      success: true,
      data: transformedData,
      pagination: result.pagination,
      message: this.options.messages?.fetched,
      meta: {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  };

  /**
   * Get single resource by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError("Resource ID is required");
    }

    // Check permissions
    if (this.options.permissionChecker) {
      const hasPermission = await this.options.permissionChecker(req, 'read');
      if (!hasPermission) {
        throw new ForbiddenError("Insufficient permissions to read resource");
      }
    }

    // Check resource-specific permissions
    if (this.options.resourcePermissionChecker) {
      const hasPermission = await this.options.resourcePermissionChecker(req, id, 'read');
      if (!hasPermission) {
        throw new ForbiddenError("Insufficient permissions to read this resource");
      }
    }

    // Find resource
    const resource = await handleDatabaseOperation(
      () => this.model.findUnique({
        where: { id },
        include: this.options.include,
        select: this.options.select
      }),
      "Fetching resource by ID"
    );

    if (!resource) {
      throw new NotFoundError(this.options.messages?.notFound || "Resource not found");
    }

    // Transform output
    const transformedResource = this.options.transformOutput 
      ? this.options.transformOutput(resource)
      : resource;

    sendSuccessResponse(res, transformedResource, "Resource fetched successfully");
  };

  /**
   * Update resource by ID
   */
  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError("Resource ID is required");
    }

    // Check permissions
    if (this.options.permissionChecker) {
      const hasPermission = await this.options.permissionChecker(req, 'update');
      if (!hasPermission) {
        throw new ForbiddenError("Insufficient permissions to update resource");
      }
    }

    // Check resource-specific permissions
    if (this.options.resourcePermissionChecker) {
      const hasPermission = await this.options.resourcePermissionChecker(req, id, 'update');
      if (!hasPermission) {
        throw new ForbiddenError("Insufficient permissions to update this resource");
      }
    }

    // Check if resource exists
    const existingResource = await handleDatabaseOperation(
      () => this.model.findUnique({ where: { id } }),
      "Checking if resource exists"
    );

    if (!existingResource) {
      throw new NotFoundError(this.options.messages?.notFound || "Resource not found");
    }

    // Validate input
    let validatedData = req.body;
    if (this.options.updateValidator) {
      const validation = this.options.updateValidator(req.body);
      if (!validation.success) {
        throw new ValidationError("Invalid input data", validation.error);
      }
      validatedData = validation.data || req.body;
    }

    // Transform input
    if (this.options.transformInput) {
      validatedData = this.options.transformInput(validatedData, 'update');
    }

    // Before update hook
    if (this.options.beforeUpdate) {
      validatedData = await this.options.beforeUpdate(validatedData, id, req);
    }

    // Update resource
    const updatedResource = await handleDatabaseOperation(
      () => this.model.update({
        where: { id },
        data: validatedData,
        include: this.options.include,
        select: this.options.select
      }),
      "Updating resource"
    );

    // After update hook
    if (this.options.afterUpdate) {
      await this.options.afterUpdate(updatedResource, req);
    }

    // Transform output
    const transformedResource = this.options.transformOutput 
      ? this.options.transformOutput(updatedResource)
      : updatedResource;

    sendSuccessResponse(res, transformedResource, this.options.messages?.updated);
  };

  /**
   * Delete resource by ID
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError("Resource ID is required");
    }

    // Check permissions
    if (this.options.permissionChecker) {
      const hasPermission = await this.options.permissionChecker(req, 'delete');
      if (!hasPermission) {
        throw new ForbiddenError("Insufficient permissions to delete resource");
      }
    }

    // Check resource-specific permissions
    if (this.options.resourcePermissionChecker) {
      const hasPermission = await this.options.resourcePermissionChecker(req, id, 'delete');
      if (!hasPermission) {
        throw new ForbiddenError("Insufficient permissions to delete this resource");
      }
    }

    // Check if resource exists
    const existingResource = await handleDatabaseOperation(
      () => this.model.findUnique({ where: { id } }),
      "Checking if resource exists"
    );

    if (!existingResource) {
      throw new NotFoundError(this.options.messages?.notFound || "Resource not found");
    }

    // Before delete hook
    if (this.options.beforeDelete) {
      await this.options.beforeDelete(id, req);
    }

    // Delete resource
    await handleDatabaseOperation(
      () => this.model.delete({ where: { id } }),
      "Deleting resource"
    );

    // After delete hook
    if (this.options.afterDelete) {
      await this.options.afterDelete(id, req);
    }

    sendSuccessResponse(res, { id, deleted: true }, this.options.messages?.deleted);
  };
}

/**
 * Factory function to create CRUD operations
 */
export const createCrudOperations = <T>(model: any, options: CrudOptions = {}) => {
  const crud = new GenericCrud<T>(model, options);
  
  return {
    create: crud.create,
    getAll: crud.getAll,
    getById: crud.getById,
    update: crud.update,
    delete: crud.delete
  };
};

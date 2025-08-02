import { Response, Request, NextFunction } from "express";
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from "../../packages/error-handaler/index";
import {
  asyncHandler,
  sendSuccessResponse,
  validateRequiredFields,
  checkResourceExists,
  handleDatabaseOperation,
} from "../../packages/error-handaler/error-middleware";
import prisma from "../../packages/libs/prisma";
import {
  extractPaginationParams,
  buildSearchWhere,
  buildSortObject,
  PaginatedResponse,
  SearchableField,
  SortableField,
} from "../../packages/utils/helpers/pagination.helper";
import {
  createCatSchema,
  updateCatSchema,
  animalIdSchema,
  tagNumberSchema,
  getAnimalsQuerySchema,
} from "../../packages/validators/animal.validators";

// Searchable fields for cats
const searchableFields: SearchableField[] = [
  { field: 'name', type: 'string' },
  { field: 'tagNumber', type: 'string' },
  { field: 'microchipNo', type: 'string' },
  { field: 'breed', type: 'string' },
  { field: 'colour', type: 'string' },
  { field: 'suburb', type: 'string' },
];

// Sortable fields for cats
const sortableFields: SortableField[] = [
  { field: 'createdAt' },
  { field: 'updatedAt' },
  { field: 'name' },
  { field: 'tagNumber' },
  { field: 'breed' },
];

// Create a new cat
export const createCat = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate request body
    const validationResult = createCatSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        `Validation failed: ${validationResult.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }

    const catData = validationResult.data;

    // Process date fields
    const processedData = {
      ...catData,
      currentConvictionBannedStartDate: catData.currentConvictionBannedStartDate 
        ? new Date(catData.currentConvictionBannedStartDate) 
        : null,
      currentConvictionBannedEndDate: catData.currentConvictionBannedEndDate 
        ? new Date(catData.currentConvictionBannedEndDate) 
        : null,
    };

    // Check if tag number already exists
    const existingCat = await prisma.cat.findUnique({
      where: { tagNumber: processedData.tagNumber },
    });

    if (existingCat) {
      throw new ConflictError("Cat with this tag number already exists");
    }

    // If ownerId is provided, verify the owner exists
    if (processedData.ownerId) {
      await checkResourceExists(
        prisma.user.findUnique({ where: { id: processedData.ownerId } }),
        "Owner not found"
      );
    }

    // Create the cat
    const cat = await handleDatabaseOperation(
      () => prisma.cat.create({
        data: processedData,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      "Failed to create cat"
    );

    sendSuccessResponse(res, cat, "Cat created successfully", 201);
  }
);

// Get all cats with pagination and search
export const getCats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate query parameters
    const queryValidation = getAnimalsQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      throw new ValidationError(
        `Invalid query parameters: ${queryValidation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }

    // Extract pagination parameters
    const paginationParams = extractPaginationParams(req, {
      defaultLimit: 10,
      maxLimit: 100,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
    });

    // Build search conditions
    const searchWhere = buildSearchWhere(paginationParams.search, searchableFields);

    // Build sort object
    const sortObject = buildSortObject(
      paginationParams.sortBy,
      paginationParams.sortOrder,
      sortableFields
    );

    // Get total count
    const totalCount = await handleDatabaseOperation(
      () => prisma.cat.count({ where: searchWhere }),
      "Failed to count cats"
    ) as number;

    // Get cats with pagination
    const cats = await handleDatabaseOperation(
      () => prisma.cat.findMany({
        where: searchWhere,
        orderBy: sortObject,
        skip: paginationParams.skip,
        take: paginationParams.limit,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      "Failed to fetch cats"
    ) as any[];

    // Build paginated response
    const paginatedResponse: PaginatedResponse<any> = {
      data: cats,
      pagination: {
        page: paginationParams.page,
        limit: paginationParams.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / paginationParams.limit),
        hasNextPage: paginationParams.page < Math.ceil(totalCount / paginationParams.limit),
        hasPrevPage: paginationParams.page > 1,
      },
    };

    sendSuccessResponse(res, paginatedResponse, "Cats retrieved successfully");
  }
);

// Get cat by ID
export const getCatById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate cat ID
    const validationResult = animalIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      throw new ValidationError(
        `Invalid cat ID: ${validationResult.error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    const { id } = validationResult.data;

    // Find cat by ID
    const cat = await handleDatabaseOperation(
      () => prisma.cat.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      "Failed to fetch cat"
    );

    if (!cat) {
      throw new NotFoundError("Cat not found");
    }

    sendSuccessResponse(res, cat, "Cat retrieved successfully");
  }
);

// Get cat by tag number
export const getCatByTagNumber = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate tag number
    const validationResult = tagNumberSchema.safeParse(req.params);
    if (!validationResult.success) {
      throw new ValidationError(
        `Invalid tag number: ${validationResult.error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    const { tagNumber } = validationResult.data;

    // Find cat by tag number
    const cat = await handleDatabaseOperation(
      () => prisma.cat.findUnique({
        where: { tagNumber },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      "Failed to fetch cat"
    );

    if (!cat) {
      throw new NotFoundError("Cat not found");
    }

    sendSuccessResponse(res, cat, "Cat retrieved successfully");
  }
);

// Update cat by ID
export const updateCat = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate cat ID
    const idValidation = animalIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      throw new ValidationError(
        `Invalid cat ID: ${idValidation.error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    // Validate request body
    const bodyValidation = updateCatSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      throw new ValidationError(
        `Validation failed: ${bodyValidation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }

    const { id } = idValidation.data;
    const updateData = bodyValidation.data;

    // Check if cat exists
    await checkResourceExists(
      prisma.cat.findUnique({ where: { id } }),
      "Cat not found"
    );

    // If tag number is being updated, check for conflicts
    if (updateData.tagNumber) {
      const existingCat = await prisma.cat.findFirst({
        where: {
          tagNumber: updateData.tagNumber,
          id: { not: id },
        },
      });

      if (existingCat) {
        throw new ConflictError("Another cat with this tag number already exists");
      }
    }

    // If ownerId is being updated, verify the owner exists
    if (updateData.ownerId) {
      await checkResourceExists(
        prisma.user.findUnique({ where: { id: updateData.ownerId } }),
        "Owner not found"
      );
    }

    // Process date fields
    const processedUpdateData = {
      ...updateData,
      currentConvictionBannedStartDate: updateData.currentConvictionBannedStartDate 
        ? new Date(updateData.currentConvictionBannedStartDate) 
        : undefined,
      currentConvictionBannedEndDate: updateData.currentConvictionBannedEndDate 
        ? new Date(updateData.currentConvictionBannedEndDate) 
        : undefined,
    };

    // Update the cat
    const updatedCat = await handleDatabaseOperation(
      () => prisma.cat.update({
        where: { id },
        data: processedUpdateData,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      "Failed to update cat"
    );

    sendSuccessResponse(res, updatedCat, "Cat updated successfully");
  }
);

// Delete cat by ID
export const deleteCat = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate cat ID
    const validationResult = animalIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      throw new ValidationError(
        `Invalid cat ID: ${validationResult.error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    const { id } = validationResult.data;

    // Check if cat exists
    await checkResourceExists(
      prisma.cat.findUnique({ where: { id } }),
      "Cat not found"
    );

    // Delete the cat
    await handleDatabaseOperation(
     () => prisma.cat.delete({ where: { id } }),
      "Failed to delete cat"
    );

    sendSuccessResponse(res, null, "Cat deleted successfully");
  }
);

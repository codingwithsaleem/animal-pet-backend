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
  createDogSchema,
  updateDogSchema,
  animalIdSchema,
  tagNumberSchema,
  getAnimalsQuerySchema,
} from "../../packages/validators/animal.validators";

// Searchable fields for dogs
const searchableFields: SearchableField[] = [
  { field: 'name', type: 'string' },
  { field: 'tagNumber', type: 'string' },
  { field: 'microchipNo', type: 'string' },
  { field: 'breed', type: 'string' },
  { field: 'colour', type: 'string' },
  { field: 'suburb', type: 'string' },
];

// Sortable fields for dogs
const sortableFields: SortableField[] = [
  { field: 'createdAt' },
  { field: 'updatedAt' },
  { field: 'name' },
  { field: 'tagNumber' },
  { field: 'breed' },
];

// Create a new dog
export const createDog = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate request body
    const validationResult = createDogSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(
        `Validation failed: ${validationResult.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }

    const dogData = validationResult.data;

    // Process date fields
    const processedData = {
      ...dogData,
      currentConvictionBannedStartDate: dogData.currentConvictionBannedStartDate 
        ? new Date(dogData.currentConvictionBannedStartDate) 
        : null,
      currentConvictionBannedEndDate: dogData.currentConvictionBannedEndDate 
        ? new Date(dogData.currentConvictionBannedEndDate) 
        : null,
    };

    // Check if tag number already exists
    const existingDog = await prisma.dog.findUnique({
      where: { tagNumber: processedData.tagNumber },
    });

    if (existingDog) {
      throw new ConflictError("Dog with this tag number already exists");
    }

    // If ownerId is provided, verify the owner exists
    if (processedData.ownerId) {
      await checkResourceExists(
        prisma.user.findUnique({ where: { id: processedData.ownerId } }),
        "Owner not found"
      );
    }

    // Create the dog
    const dog = await handleDatabaseOperation(
      () => prisma.dog.create({
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
      "Failed to create dog"
    );

    sendSuccessResponse(res, dog, "Dog created successfully", 201);
  }
);

// Get all dogs with pagination and search
export const getDogs = asyncHandler(
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
      () => prisma.dog.count({ where: searchWhere }),
      "Failed to count dogs"
    ) as number;

    // Get dogs with pagination
    const dogs = await handleDatabaseOperation(
      () => prisma.dog.findMany({
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
      "Failed to fetch dogs"
    ) as any[];

    // Build paginated response
    const paginatedResponse: PaginatedResponse<any> = {
      data: dogs,
      pagination: {
        page: paginationParams.page,
        limit: paginationParams.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / paginationParams.limit),
        hasNextPage: paginationParams.page < Math.ceil(totalCount / paginationParams.limit),
        hasPrevPage: paginationParams.page > 1,
      },
    };

    sendSuccessResponse(res, paginatedResponse, "Dogs retrieved successfully");
  }
);

// Get dog by ID
export const getDogById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate dog ID
    const validationResult = animalIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      throw new ValidationError(
        `Invalid dog ID: ${validationResult.error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    const { id } = validationResult.data;

    // Find dog by ID
    const dog = await handleDatabaseOperation(
      () => prisma.dog.findUnique({
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
      "Failed to fetch dog"
    );

    if (!dog) {
      throw new NotFoundError("Dog not found");
    }

    sendSuccessResponse(res, dog, "Dog retrieved successfully");
  }
);

// Get dog by tag number
export const getDogByTagNumber = asyncHandler(
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

    // Find dog by tag number
    const dog = await handleDatabaseOperation(
      () => prisma.dog.findUnique({
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
      "Failed to fetch dog"
    );

    if (!dog) {
      throw new NotFoundError("Dog not found");
    }

    sendSuccessResponse(res, dog, "Dog retrieved successfully");
  }
);

// Update dog by ID
export const updateDog = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate dog ID
    const idValidation = animalIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      throw new ValidationError(
        `Invalid dog ID: ${idValidation.error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    // Validate request body
    const bodyValidation = updateDogSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      throw new ValidationError(
        `Validation failed: ${bodyValidation.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }

    const { id } = idValidation.data;
    const updateData = bodyValidation.data;

    // Check if dog exists
    await checkResourceExists(
      prisma.dog.findUnique({ where: { id } }),
      "Dog not found"
    );

    // If tag number is being updated, check for conflicts
    if (updateData.tagNumber) {
      const existingDog = await prisma.dog.findFirst({
        where: {
          tagNumber: updateData.tagNumber,
          id: { not: id },
        },
      });

      if (existingDog) {
        throw new ConflictError("Another dog with this tag number already exists");
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

    // Update the dog
    const updatedDog = await handleDatabaseOperation(
      () => prisma.dog.update({
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
      "Failed to update dog"
    );

    sendSuccessResponse(res, updatedDog, "Dog updated successfully");
  }
);

// Delete dog by ID
export const deleteDog = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate dog ID
    const validationResult = animalIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      throw new ValidationError(
        `Invalid dog ID: ${validationResult.error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    const { id } = validationResult.data;

    // Check if dog exists
    await checkResourceExists(
      prisma.dog.findUnique({ where: { id } }),
      "Dog not found"
    );

    // Delete the dog
    await handleDatabaseOperation(
      () => prisma.dog.delete({ where: { id } }),
      "Failed to delete dog"
    );

    sendSuccessResponse(res, null, "Dog deleted successfully");
  }
);

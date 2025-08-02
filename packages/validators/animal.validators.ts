import { z } from "zod";

// Base animal schema
export const baseAnimalSchema = z.object({
  tagNumber: z.string().min(1, "Tag number is required"),
  na: z.string().min(1, "NA field is required"),
  lastName: z.string().min(1, "Last name is required"),
  givenName: z.string().min(1, "Given name is required"),
  addressNo: z.string().min(1, "Address number is required"),
  lotNo: z.string().min(1, "Lot number is required"),
  houseNo: z.string().min(1, "House number is required"),
  street: z.string().min(1, "Street is required"),
  suburb: z.string().min(1, "Suburb is required"),
  name: z.string().min(1, "Animal name is required"),
  breedCode: z.string().min(1, "Breed code is required"),
  breed: z.string().min(1, "Breed is required"),
  colour: z.string().min(1, "Colour is required"),
  markings: z.string().min(1, "Markings are required"),
  sterilised: z.boolean().default(false),
  nextYearTagNo: z.string().min(1, "Next year tag number is required"),
  oldTagNo: z.string().min(1, "Old tag number is required"),
  microchipNo: z.string().min(1, "Microchip number is required"),
  currentConvictionBannedStartDate: z.string().datetime().optional().or(z.literal("")),
  currentConvictionBannedEndDate: z.string().datetime().optional().or(z.literal("")),
  ownerId: z.string().uuid().optional(),
});

// Cat creation schema
export const createCatSchema = baseAnimalSchema;

// Cat update schema (all fields optional except id)
export const updateCatSchema = baseAnimalSchema.partial();

// Dog creation schema (extends base with dog-specific fields)
export const createDogSchema = baseAnimalSchema.extend({
  dangerous: z.boolean().default(false),
  animalBreeder: z.boolean().default(false),
});

// Dog update schema
export const updateDogSchema = createDogSchema.partial();

// Query parameters for getting animals
export const getAnimalsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Animal ID parameter
export const animalIdSchema = z.object({
  id: z.string().uuid("Invalid animal ID format"),
});

// Tag number parameter
export const tagNumberSchema = z.object({
  tagNumber: z.string().min(1, "Tag number is required"),
});

// Search query schema
export const searchAnimalsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  type: z.enum(['cat', 'dog']).optional(),
});

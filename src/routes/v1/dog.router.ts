import express, { Router } from 'express';
import { 
  createDog, 
  getDogs, 
  getDogById, 
  updateDog, 
  deleteDog,
  getDogByTagNumber
} from '../../controller/dog.controller';
import { authenticateToken } from '../../../packages/utils/middlewares/auth.middleware';

const dogRouter: Router = express.Router();

/**
 * Dog creation request
 * @typedef {object} CreateDogRequest
 * @property {string} tagNumber.required - Tag number
 * @property {string} na.required - NA field
 * @property {string} lastName.required - Last name
 * @property {string} givenName.required - Given name
 * @property {string} addressNo.required - Address number
 * @property {string} lotNo.required - Lot number
 * @property {string} houseNo.required - House number
 * @property {string} street.required - Street
 * @property {string} suburb.required - Suburb
 * @property {string} name.required - Animal name
 * @property {string} breedCode.required - Breed code
 * @property {string} breed.required - Breed
 * @property {string} colour.required - Colour
 * @property {string} markings.required - Markings
 * @property {boolean} sterilised - Is sterilised
 * @property {string} nextYearTagNo.required - Next year tag number
 * @property {string} oldTagNo.required - Old tag number
 * @property {string} microchipNo.required - Microchip number
 * @property {string} currentConvictionBannedStartDate - Conviction banned start date
 * @property {string} currentConvictionBannedEndDate - Conviction banned end date
 * @property {boolean} dangerous - Is dangerous
 * @property {boolean} animalBreeder - Is animal breeder
 * @property {string} ownerId - Owner ID
 */

/**
 * Dog update request
 * @typedef {object} UpdateDogRequest
 * @property {string} tagNumber - Tag number
 * @property {string} na - NA field
 * @property {string} lastName - Last name
 * @property {string} givenName - Given name
 * @property {string} addressNo - Address number
 * @property {string} lotNo - Lot number
 * @property {string} houseNo - House number
 * @property {string} street - Street
 * @property {string} suburb - Suburb
 * @property {string} name - Animal name
 * @property {string} breedCode - Breed code
 * @property {string} breed - Breed
 * @property {string} colour - Colour
 * @property {string} markings - Markings
 * @property {boolean} sterilised - Is sterilised
 * @property {string} nextYearTagNo - Next year tag number
 * @property {string} oldTagNo - Old tag number
 * @property {string} microchipNo - Microchip number
 * @property {string} currentConvictionBannedStartDate - Conviction banned start date
 * @property {string} currentConvictionBannedEndDate - Conviction banned end date
 * @property {boolean} dangerous - Is dangerous
 * @property {boolean} animalBreeder - Is animal breeder
 * @property {string} ownerId - Owner ID
 */

/**
 * POST /dogs
 * @tags Dogs
 * @summary Create a new dog
 * @security BearerAuth
 * @param {CreateDogRequest} request.body.required - Dog data
 * @return {object} 201 - Success
 */
dogRouter.post('/', authenticateToken, createDog);

/**
 * GET /dogs
 * @tags Dogs
 * @summary Get all dogs with pagination and search
 * @security BearerAuth
 * @param {number} page.query - Page number (default: 1)
 * @param {number} limit.query - Items per page (default: 10, max: 100)
 * @param {string} search.query - Search by name, tag number, or microchip number
 * @param {string} sortBy.query - Sort by field (default: createdAt)
 * @param {string} sortOrder.query - Sort order: asc or desc (default: desc)
 * @return {object} 200 - Success
 */
dogRouter.get('/', authenticateToken, getDogs);

/**
 * GET /dogs/{id}
 * @tags Dogs
 * @summary Get dog by ID
 * @security BearerAuth
 * @param {string} id.path.required - Dog ID
 * @return {object} 200 - Success
 */
dogRouter.get('/:id', authenticateToken, getDogById);

/**
 * GET /dogs/tag/{tagNumber}
 * @tags Dogs
 * @summary Get dog by tag number
 * @security BearerAuth
 * @param {string} tagNumber.path.required - Dog tag number
 * @return {object} 200 - Success
 */
dogRouter.get('/tag/:tagNumber', authenticateToken, getDogByTagNumber);

/**
 * PUT /dogs/{id}
 * @tags Dogs
 * @summary Update dog by ID
 * @security BearerAuth
 * @param {string} id.path.required - Dog ID
 * @param {UpdateDogRequest} request.body.required - Dog data to update
 * @return {object} 200 - Success
 */
dogRouter.put('/:id', authenticateToken, updateDog);

/**
 * DELETE /dogs/{id}
 * @tags Dogs
 * @summary Delete dog by ID
 * @security BearerAuth
 * @param {string} id.path.required - Dog ID
 * @return {object} 200 - Success
 */
dogRouter.delete('/:id', authenticateToken, deleteDog);

export default dogRouter;

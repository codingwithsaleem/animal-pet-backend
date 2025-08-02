import express, { Router } from 'express';
import { 
  createCat, 
  getCats, 
  getCatById, 
  updateCat, 
  deleteCat,
  getCatByTagNumber
} from '../../controller/cat.controller';
import { authenticateToken } from '../../../packages/utils/middlewares/auth.middleware';

const catRouter: Router = express.Router();

/**
 * Cat creation request
 * @typedef {object} CreateCatRequest
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
 * @property {string} ownerId - Owner ID
 */

/**
 * Cat update request
 * @typedef {object} UpdateCatRequest
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
 * @property {string} ownerId - Owner ID
 */

/**
 * POST /cats
 * @tags Cats
 * @summary Create a new cat
 * @security BearerAuth
 * @param {CreateCatRequest} request.body.required - Cat data
 * @return {object} 201 - Success
 */
catRouter.post('/', authenticateToken, createCat);

/**
 * GET /cats
 * @tags Cats
 * @summary Get all cats with pagination and search
 * @security BearerAuth
 * @param {number} page.query - Page number (default: 1)
 * @param {number} limit.query - Items per page (default: 10, max: 100)
 * @param {string} search.query - Search by name, tag number, or microchip number
 * @param {string} sortBy.query - Sort by field (default: createdAt)
 * @param {string} sortOrder.query - Sort order: asc or desc (default: desc)
 * @return {object} 200 - Success
 */
catRouter.get('/', authenticateToken, getCats);

/**
 * GET /cats/{id}
 * @tags Cats
 * @summary Get cat by ID
 * @security BearerAuth
 * @param {string} id.path.required - Cat ID
 * @return {object} 200 - Success
 */
catRouter.get('/:id', authenticateToken, getCatById);

/**
 * GET /cats/tag/{tagNumber}
 * @tags Cats
 * @summary Get cat by tag number
 * @security BearerAuth
 * @param {string} tagNumber.path.required - Cat tag number
 * @return {object} 200 - Success
 */
catRouter.get('/tag/:tagNumber', authenticateToken, getCatByTagNumber);

/**
 * PUT /cats/{id}
 * @tags Cats
 * @summary Update cat by ID
 * @security BearerAuth
 * @param {string} id.path.required - Cat ID
 * @param {UpdateCatRequest} request.body.required - Cat data to update
 * @return {object} 200 - Success
 */
catRouter.put('/:id', authenticateToken, updateCat);

/**
 * DELETE /cats/{id}
 * @tags Cats
 * @summary Delete cat by ID
 * @security BearerAuth
 * @param {string} id.path.required - Cat ID
 * @return {object} 200 - Success
 */
catRouter.delete('/:id', authenticateToken, deleteCat);

export default catRouter;

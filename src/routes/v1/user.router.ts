import express from 'express';
import { Router } from 'express';
import { authenticateToken } from '../../../packages/utils/middlewares/auth.middleware';

const userRouter: Router = express.Router();



export default userRouter;
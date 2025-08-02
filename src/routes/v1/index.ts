import express from 'express';
import autRrouter from './auth.router';
import userRouter from './user.router';
import catRouter from './cat.router';
import dogRouter from './dog.router';

const v1Router = express.Router();

v1Router.use('/auth', autRrouter);
v1Router.use('/user', userRouter);
v1Router.use('/cats', catRouter);
v1Router.use('/dogs', dogRouter);

export default v1Router;
import express from 'express';
import { apiRouter } from './api.js';

export function createApiApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount API router
  app.use('/', apiRouter);

  return app;
}

export const apiApp = createApiApp();

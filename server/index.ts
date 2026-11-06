import express from 'express';
import { apiRouter } from './api.js';

export function createApiApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount API router
  app.use('/', apiRouter);

  // Catch-all for unknown API endpoints so they return JSON 404, never falling through to HTML
  app.use((req, res) => {
    res.status(404).json({
      error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
      status: 404,
    });
  });

  return app;
}

export const apiApp = createApiApp();

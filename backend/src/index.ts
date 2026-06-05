import dotenv from 'dotenv';
// Load environment variables before any other module imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRouter from './modules/auth/auth.router';
import projectsRouter from './modules/projects/projects.router';
import entitiesRouter from './modules/entities/entities.router';
import generatorRouter from './modules/generator/generator.router';
import { errorHandler, AppError } from './core/errors';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for local development clients
app.use(cors({
  origin: '*', // In production, replace with structured configurations
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Bind modular REST route hooks
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/projects/:projectId/entities', entitiesRouter);
app.use('/api/v1/projects/:projectId/resources/:entitySlug', generatorRouter);

// Base sanity check hook
app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Fallback catch for unregistered API routes
app.use('*', (req, res, next) => {
  next(new AppError(`Endpoint '${req.originalUrl}' not found on this system`, 404));
});

// Register Global Error Handler Middleware
app.use(errorHandler as any);

app.listen(PORT, () => {
  console.log('🔑 DATABASE_URL:', process.env.DATABASE_URL);
  console.log(`========================================`);
  console.log(` 🚀 CodeForge Dynamic Backend Engine    `);
  console.log(` ⚡ Running on http://localhost:${PORT} `);
  console.log(`========================================`);
});

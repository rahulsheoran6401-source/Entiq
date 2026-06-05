import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details: any;

  constructor(message: string, statusCode = 500, details: any = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Express Error Handling Middleware.
 * Captures all throw statements, returning consistent JSON responses.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Format clean JSON payload for response
  const errorResponse = {
    error: {
      message,
      status: statusCode,
      details: err.details || null,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  };

  // Log non-operational (unhandled program bugs) errors to console
  if (!err.isOperational) {
    console.error(' [CRITICAL EXCEPTION]:', err);
  } else {
    console.warn(` [AppError ${statusCode}]: ${message}`, err.details ? JSON.stringify(err.details) : '');
  }

  return res.status(statusCode).json(errorResponse);
}

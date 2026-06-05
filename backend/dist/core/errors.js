"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
class AppError extends Error {
    statusCode;
    isOperational;
    details;
    constructor(message, statusCode = 500, details = null, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Global Express Error Handling Middleware.
 * Captures all throw statements, returning consistent JSON responses.
 */
function errorHandler(err, req, res, next) {
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
    }
    else {
        console.warn(` [AppError ${statusCode}]: ${message}`, err.details ? JSON.stringify(err.details) : '');
    }
    return res.status(statusCode).json(errorResponse);
}
